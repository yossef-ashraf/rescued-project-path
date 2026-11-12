/**
 * Sequelize-compatible data layer backed by Lovable Cloud.
 *
 * The original app talked to Postgres through Sequelize models. Those models and every controller
 * are kept as-is; this module implements the subset of the Sequelize API they use on top of the
 * request-scoped database client (see db-context.server.js). Row-level security therefore applies
 * to every query made on behalf of a signed-in user.
 */
import { getDbClient } from './db-context.server.js';

// ---------------------------------------------------------------- operators & helpers
const OP_NAMES = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'like', 'notLike', 'iLike', 'notILike',
    'or', 'and', 'not', 'is', 'between', 'notBetween', 'startsWith', 'endsWith', 'substring', 'contains'];
export const Op = Object.fromEntries(OP_NAMES.map((n) => [n, Symbol.for(n)]));

class Fn { constructor(name, args) { this.fn = name; this.args = args; } }
class Col { constructor(name) { this.col = name; } }
class Literal { constructor(val) { this.val = val; } }
class Where { constructor(attribute, comparator, logic) { this.attribute = attribute; this.comparator = comparator; this.logic = logic; } }

export const fn = (name, ...args) => new Fn(name, args);
export const col = (name) => new Col(name);
export const literal = (val) => new Literal(val);
export const where = (attribute, comparator, logic) =>
    logic === undefined ? new Where(attribute, Op.eq, comparator) : new Where(attribute, comparator, logic);

function makeType(key) {
    const t = (...args) => ({ key, args });
    t.key = key;
    t.args = [];
    return t;
}
export const DataTypes = new Proxy({ NOW: { __now: true } }, {
    get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        target[prop] = makeType(prop);
        return target[prop];
    }
});

export class UniqueConstraintError extends Error {
    constructor(message, original) {
        super(message);
        this.name = 'SequelizeUniqueConstraintError';
        this.original = original;
        this.errors = [{ message }];
    }
}
export class DatabaseError extends Error {
    constructor(message, original) {
        super(message);
        this.name = 'SequelizeDatabaseError';
        this.original = original;
        this.code = original?.code;
    }
}

function raise(error, context) {
    const msg = `${context}: ${error?.message || 'database error'}`;
    if (error?.code === '23505') throw new UniqueConstraintError(msg, error);
    throw new DatabaseError(msg, error);
}

// ---------------------------------------------------------------- value conversion
const typeKey = (def) => def?.type?.key || def?.type || null;

function fromDb(model, row) {
    if (!row || typeof row !== 'object') return row;
    const out = { ...row };
    for (const [name, def] of Object.entries(model.rawAttributes)) {
        if (!(name in out)) continue;
        const v = out[name];
        if (v === null || v === undefined) continue;
        const k = typeKey(def);
        if (k === 'BIGINT' || k === 'DECIMAL') out[name] = String(v);
        else if (k === 'DATE' && !(v instanceof Date)) {
            const d = new Date(v);
            out[name] = Number.isNaN(d.getTime()) ? v : d;
        }
    }
    return out;
}

function toDbValue(def, v) {
    if (v === undefined) return undefined;
    if (v === null) return null;
    if (v && typeof v === 'object' && v.__now) return new Date().toISOString();
    if (v instanceof Fn && /^now$/i.test(v.fn)) return new Date().toISOString();
    if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
    const k = typeKey(def);
    if ((k === 'INTEGER' || k === 'BIGINT' || k === 'SMALLINT') && typeof v === 'boolean') return v ? 1 : 0;
    if ((k === 'INTEGER' || k === 'BIGINT' || k === 'DECIMAL' || k === 'FLOAT' || k === 'DOUBLE' || k === 'REAL' || k === 'SMALLINT') && v === '') return null;
    if (k === 'BOOLEAN' && typeof v === 'number') return v !== 0;
    if ((k === 'TEXT' || k === 'STRING') && typeof v === 'object') return JSON.stringify(v);
    return v;
}

function toDbRow(model, values) {
    const out = {};
    for (const [name, def] of Object.entries(model.rawAttributes)) {
        if (!(name in values)) continue;
        const v = toDbValue(def, values[name]);
        if (v !== undefined) out[name] = v;
    }
    return out;
}

function filterValue(v) {
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'boolean') return v;
    return v;
}

// ---------------------------------------------------------------- where -> PostgREST
function quote(v) {
    const s = String(filterValue(v));
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
function likeToPattern(p) { return String(p).replace(/%/g, '*'); }
function escapeLikeExact(s) { return String(s).replace(/[%_\\]/g, (m) => `\\${m}`); }

function resolveColumn(attr) {
    if (attr instanceof Col) return { column: attr.col, lower: false };
    if (attr instanceof Fn) {
        const inner = attr.args[0];
        const base = resolveColumn(inner);
        if (/^lower$|^upper$/i.test(attr.fn)) return { ...base, lower: true };
        if (/^extract$/i.test(attr.fn)) return { ...base, extract: true };
        return base;
    }
    if (attr instanceof Literal) {
        const m = String(attr.val).match(/"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*$/);
        return { column: m ? m[1] : String(attr.val), lower: false };
    }
    return { column: String(attr), lower: false };
}

// Returns a list of PostgREST filter-string conditions (used inside or()/and()).
function conditionsToStrings(whereObj) {
    if (!whereObj) return [];
    if (whereObj instanceof Where) return [whereMarkerToString(whereObj)];
    if (Array.isArray(whereObj)) return [`and(${whereObj.flatMap(conditionsToStrings).join(',')})`];
    const parts = [];
    for (const key of Reflect.ownKeys(whereObj)) {
        const value = whereObj[key];
        if (key === Op.or) {
            const subs = (Array.isArray(value) ? value : [value]).map((s) => groupAnd(conditionsToStrings(s)));
            parts.push(`or(${subs.join(',')})`);
        } else if (key === Op.and) {
            const subs = (Array.isArray(value) ? value : [value]).flatMap(conditionsToStrings);
            parts.push(`and(${subs.join(',')})`);
        } else if (typeof key === 'string') {
            parts.push(...columnToStrings(key, value));
        }
    }
    return parts;
}
function groupAnd(list) { return list.length === 1 ? list[0] : `and(${list.join(',')})`; }

function whereMarkerToString(w) {
    const { column, lower } = resolveColumn(w.attribute);
    if (lower && (w.comparator === Op.eq || w.comparator === '=')) return `${column}.ilike.${quote(escapeLikeExact(w.logic))}`;
    return columnToStrings(column, { [w.comparator]: w.logic })[0];
}

function columnToStrings(column, value) {
    if (value === null) return [`${column}.is.null`];
    if (value instanceof Where) return [whereMarkerToString(value)];
    if (Array.isArray(value)) return [`${column}.in.(${value.map(quote).join(',')})`];
    if (value instanceof Date || typeof value !== 'object') return [`${column}.eq.${quote(value)}`];
    const out = [];
    for (const op of Reflect.ownKeys(value)) {
        const v = value[op];
        switch (op) {
            case Op.eq: out.push(v === null ? `${column}.is.null` : `${column}.eq.${quote(v)}`); break;
            case Op.ne: out.push(v === null ? `${column}.not.is.null` : `${column}.neq.${quote(v)}`); break;
            case Op.is: out.push(`${column}.is.${v === null ? 'null' : String(v)}`); break;
            case Op.not: out.push(v === null ? `${column}.not.is.null` : `${column}.neq.${quote(v)}`); break;
            case Op.gt: out.push(`${column}.gt.${quote(v)}`); break;
            case Op.gte: out.push(`${column}.gte.${quote(v)}`); break;
            case Op.lt: out.push(`${column}.lt.${quote(v)}`); break;
            case Op.lte: out.push(`${column}.lte.${quote(v)}`); break;
            case Op.in: out.push(`${column}.in.(${(v || []).map(quote).join(',')})`); break;
            case Op.notIn: out.push(`${column}.not.in.(${(v || []).map(quote).join(',')})`); break;
            case Op.like: out.push(`${column}.like.${quote(likeToPattern(v))}`); break;
            case Op.notLike: out.push(`${column}.not.like.${quote(likeToPattern(v))}`); break;
            case Op.iLike: out.push(`${column}.ilike.${quote(likeToPattern(v))}`); break;
            case Op.notILike: out.push(`${column}.not.ilike.${quote(likeToPattern(v))}`); break;
            case Op.startsWith: out.push(`${column}.like.${quote(`${v}*`)}`); break;
            case Op.endsWith: out.push(`${column}.like.${quote(`*${v}`)}`); break;
            case Op.substring: out.push(`${column}.ilike.${quote(`*${v}*`)}`); break;
            case Op.between: out.push(`and(${column}.gte.${quote(v[0])},${column}.lte.${quote(v[1])})`); break;
            case Op.notBetween: out.push(`or(${column}.lt.${quote(v[0])},${column}.gt.${quote(v[1])})`); break;
            case Op.or: out.push(`or(${(Array.isArray(v) ? v : [v]).map((x) => columnToStrings(column, x)[0]).join(',')})`); break;
            case Op.and: out.push(`and(${(Array.isArray(v) ? v : [v]).map((x) => columnToStrings(column, x)[0]).join(',')})`); break;
            default: break;
        }
    }
    return out;
}

function hasEmptyIn(whereObj) {
    if (!whereObj || typeof whereObj !== 'object' || whereObj instanceof Where) return false;
    for (const key of Reflect.ownKeys(whereObj)) {
        if (typeof key !== 'string') continue;
        const v = whereObj[key];
        if (Array.isArray(v) && v.length === 0) return true;
        if (v && typeof v === 'object' && !(v instanceof Date) && Array.isArray(v[Op.in]) && v[Op.in].length === 0) return true;
    }
    return false;
}

function applyWhere(q, whereObj) {
    if (!whereObj) return q;
    const parts = conditionsToStrings(whereObj).filter(Boolean);
    for (const p of parts) {
        if (p.startsWith('or(')) q = q.or(p.slice(3, -1));
        else if (p.startsWith('and(')) {
            // and(...) at top level: PostgREST supports it through the generic "and" param.
            q = q.or(`and(${p.slice(4, -1)})`);
        } else {
            const m = p.match(/^([^.]+)\.(not\.)?([a-z]+)\.(.*)$/s);
            if (!m) continue;
            const [, column, neg, operator, rawValue] = m;
            q = neg ? q.not(column, operator, unquote(rawValue)) : q.filter(column, operator, unquote(rawValue));
        }
    }
    return q;
}
function unquote(v) {
    if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    if (v.startsWith('(') && v.endsWith(')')) return v;
    return v;
}

// ---------------------------------------------------------------- select / order
function buildSelect(model, attributes) {
    if (!attributes) return '*';
    if (Array.isArray(attributes)) {
        const cols = attributes.map((a) => {
            if (typeof a === 'string') return a;
            if (Array.isArray(a) && typeof a[0] === 'string') return `${a[1]}:${a[0]}`;
            return null;
        }).filter(Boolean);
        return cols.length ? Array.from(new Set(cols)).join(',') : '*';
    }
    if (attributes.include && !attributes.exclude) return '*';
    return '*';
}
function excludedAttrs(attributes) {
    return attributes && !Array.isArray(attributes) && Array.isArray(attributes.exclude) ? attributes.exclude : [];
}

function applyOrder(q, order) {
    if (!order) return q;
    const list = Array.isArray(order) ? order : [order];
    const normalized = typeof list[0] === 'string' && list.length === 2 && /^(asc|desc)/i.test(list[1]) ? [list] : list;
    for (const item of normalized) {
        let column; let dir = 'ASC';
        if (typeof item === 'string') column = item;
        else if (item instanceof Literal || item instanceof Fn || item instanceof Col) column = resolveColumn(item).column;
        else if (Array.isArray(item)) {
            if (item.length >= 3 && typeof item[0] !== 'string') continue; // ordering on included model
            const c = item[0];
            column = typeof c === 'string' ? c : resolveColumn(c).column;
            dir = String(item[1] || 'ASC');
        }
        if (!column || /\s|\(/.test(column)) continue;
        const desc = /^desc/i.test(dir);
        const nulls = /nulls last/i.test(dir) ? { nullsFirst: false } : /nulls first/i.test(dir) ? { nullsFirst: true } : {};
        q = q.order(column, { ascending: !desc, ...nulls });
    }
    return q;
}

// ---------------------------------------------------------------- registry
const registry = {};

function normalizeInclude(include) {
    if (!include) return [];
    const list = Array.isArray(include) ? include : [include];
    return list.map((inc) => (inc && inc.model ? inc : { model: inc })).filter((i) => i.model);
}

function findAssociation(source, inc) {
    const assocs = source.associations || {};
    if (inc.as && assocs[inc.as]) return assocs[inc.as];
    return Object.values(assocs).find((a) => a.target === inc.model) || null;
}

async function loadIncludes(model, instances, include) {
    const incs = normalizeInclude(include);
    if (!incs.length || !instances.length) return instances;
    let rows = instances;
    for (const inc of incs) {
        const assoc = findAssociation(model, inc);
        if (!assoc) continue;
        const target = assoc.target;
        if (assoc.type === 'belongsTo') {
            const ids = Array.from(new Set(rows.map((r) => r.dataValues[assoc.foreignKey]).filter((v) => v !== null && v !== undefined)));
            const related = ids.length ? await target.findAll({ where: { ...(inc.where || {}), [target.primaryKeyAttribute]: ids }, attributes: inc.attributes, include: inc.include }) : [];
            const byId = new Map(related.map((r) => [String(r.dataValues[target.primaryKeyAttribute]), r]));
            for (const r of rows) r._setInclude(assoc.as, byId.get(String(r.dataValues[assoc.foreignKey])) || null);
            if (inc.required) rows = rows.filter((r) => r.dataValues[assoc.as]);
        } else {
            const ids = Array.from(new Set(rows.map((r) => r.dataValues[model.primaryKeyAttribute])));
            const related = await target.findAll({ where: { ...(inc.where || {}), [assoc.foreignKey]: ids }, attributes: inc.attributes, include: inc.include, order: inc.order || inc.separate?.order });
            const groups = new Map();
            for (const rel of related) {
                const k = String(rel.dataValues[assoc.foreignKey]);
                if (!groups.has(k)) groups.set(k, []);
                groups.get(k).push(rel);
            }
            for (const r of rows) {
                const list = groups.get(String(r.dataValues[model.primaryKeyAttribute])) || [];
                r._setInclude(assoc.as, assoc.type === 'hasOne' ? (list[0] || null) : list);
            }
            if (inc.required) rows = rows.filter((r) => (assoc.type === 'hasOne' ? r.dataValues[assoc.as] : r.dataValues[assoc.as].length));
        }
    }
    return rows;
}

function plain(value) {
    if (Array.isArray(value)) return value.map(plain);
    if (value && typeof value === 'object' && typeof value.get === 'function' && value.dataValues) return value.get({ plain: true });
    return value;
}

// ---------------------------------------------------------------- model factory
function defineModel(modelName, attributes, options = {}) {
    const tableName = options.tableName || modelName;
    const rawAttributes = {};
    for (const [name, def] of Object.entries(attributes)) {
        rawAttributes[name] = typeof def === 'function' || (def && def.key && !def.type) ? { type: def } : { ...def };
    }
    let pk = Object.keys(rawAttributes).find((k) => rawAttributes[k].primaryKey);
    if (!pk) { pk = 'id'; rawAttributes.id = { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true }; }
    const timestamps = options.timestamps !== false && options.timestamps !== undefined ? true : options.timestamps === undefined;
    const createdAtCol = timestamps && options.createdAt !== false ? (typeof options.createdAt === 'string' ? options.createdAt : (options.underscored ? 'created_at' : 'createdAt')) : null;
    const updatedAtCol = timestamps && options.updatedAt !== false ? (typeof options.updatedAt === 'string' ? options.updatedAt : (options.underscored ? 'updated_at' : 'updatedAt')) : null;
    if (createdAtCol && !rawAttributes[createdAtCol]) rawAttributes[createdAtCol] = { type: DataTypes.DATE };
    if (updatedAtCol && !rawAttributes[updatedAtCol]) rawAttributes[updatedAtCol] = { type: DataTypes.DATE };

    class Model {
        constructor(values = {}, { isNewRecord = true, raw = false } = {}) {
            Object.defineProperty(this, 'dataValues', { value: {}, writable: true, enumerable: false });
            Object.defineProperty(this, '_previousDataValues', { value: {}, writable: true, enumerable: false });
            Object.defineProperty(this, '_changed', { value: new Set(), writable: true, enumerable: false });
            Object.defineProperty(this, 'isNewRecord', { value: isNewRecord, writable: true, enumerable: false });
            Object.defineProperty(this, '_includeKeys', { value: [], writable: true, enumerable: false });
            if (isNewRecord) {
                for (const [name, def] of Object.entries(rawAttributes)) {
                    if (def.defaultValue !== undefined && values[name] === undefined) {
                        const dv = def.defaultValue;
                        this.dataValues[name] = dv && dv.__now ? new Date() : (typeof dv === 'object' && dv !== null ? JSON.parse(JSON.stringify(dv)) : dv);
                    }
                }
            }
            if (raw) Object.assign(this.dataValues, values);
            else this.set(values);
            if (!isNewRecord) {
                this._previousDataValues = { ...this.dataValues };
                this._changed = new Set();
            }
        }

        static get tableName() { return tableName; }
        static get name() { return modelName; }
        static getTableName() { return tableName; }

        getDataValue(key) { return this.dataValues[key]; }
        setDataValue(key, value) {
            if (this.dataValues[key] !== value) this._changed.add(key);
            this.dataValues[key] = value;
        }
        get(key, opts) {
            if (typeof key === 'object' && key !== null) { opts = key; key = undefined; }
            if (typeof key === 'string') {
                const def = rawAttributes[key];
                if (def && typeof def.get === 'function') return def.get.call(this);
                return this.dataValues[key];
            }
            const out = {};
            for (const k of Object.keys(this.dataValues)) {
                const def = rawAttributes[k];
                const v = def && typeof def.get === 'function' ? def.get.call(this) : this.dataValues[k];
                out[k] = opts?.plain ? plain(v) : v;
            }
            return out;
        }
        set(key, value) {
            if (key && typeof key === 'object') {
                for (const [k, v] of Object.entries(key)) this.set(k, v);
                return this;
            }
            const def = rawAttributes[key];
            if (def && typeof def.set === 'function') def.set.call(this, value);
            else if (def) this.setDataValue(key, value);
            else if (this._includeKeys.includes(key)) this.dataValues[key] = value;
            else this.dataValues[key] = value;
            return this;
        }
        changed(key) {
            if (key) return this._changed.has(key);
            return this._changed.size ? Array.from(this._changed) : false;
        }
        previous(key) { return this._previousDataValues[key]; }
        _setInclude(as, value) {
            if (!this._includeKeys.includes(as)) this._includeKeys.push(as);
            this.dataValues[as] = value;
            if (!(as in Model.prototype)) {
                Object.defineProperty(this, as, { get: () => this.dataValues[as], set: (v) => { this.dataValues[as] = v; }, configurable: true, enumerable: false });
            }
        }
        toJSON() { return this.get({ plain: true }); }

        async save(opts = {}) {
            const db = getDbClient();
            if (updatedAtCol) this.dataValues[updatedAtCol] = new Date();
            if (this.isNewRecord) {
                if (createdAtCol && !this.dataValues[createdAtCol]) this.dataValues[createdAtCol] = new Date();
                const row = toDbRow(Model, this.dataValues);
                if (rawAttributes[pk]?.autoIncrement && (row[pk] === null || row[pk] === undefined)) delete row[pk];
                const { data, error } = await db.from(tableName).insert(row).select().single();
                if (error) raise(error, `insert ${tableName}`);
                this.dataValues = { ...this.dataValues, ...fromDb(Model, data) };
                this.isNewRecord = false;
            } else {
                const fields = opts.fields || Array.from(this._changed);
                if (updatedAtCol && !fields.includes(updatedAtCol)) fields.push(updatedAtCol);
                const patch = toDbRow(Model, Object.fromEntries(fields.filter((f) => rawAttributes[f]).map((f) => [f, this.dataValues[f]])));
                delete patch[pk];
                if (Object.keys(patch).length) {
                    const { data, error } = await db.from(tableName).update(patch).eq(pk, this.dataValues[pk]).select();
                    if (error) raise(error, `update ${tableName}`);
                    if (data && data[0]) this.dataValues = { ...this.dataValues, ...fromDb(Model, data[0]) };
                }
            }
            this._previousDataValues = { ...this.dataValues };
            this._changed = new Set();
            return this;
        }
        async update(values = {}, opts = {}) {
            this.set(values);
            const fields = opts.fields || Object.keys(values).filter((k) => rawAttributes[k]);
            for (const f of fields) this._changed.add(f);
            return this.save({ fields: Array.from(this._changed) });
        }
        async destroy() {
            const db = getDbClient();
            const { error } = await db.from(tableName).delete().eq(pk, this.dataValues[pk]);
            if (error) raise(error, `delete ${tableName}`);
        }
        async reload() {
            const fresh = await Model.findByPk(this.dataValues[pk]);
            if (fresh) { this.dataValues = { ...this.dataValues, ...fresh.dataValues }; this._previousDataValues = { ...this.dataValues }; }
            return this;
        }
        async increment(field, opts = {}) {
            const by = opts.by ?? 1;
            const fields = typeof field === 'string' ? { [field]: by } : (Array.isArray(field) ? Object.fromEntries(field.map((f) => [f, by])) : field);
            for (const [f, n] of Object.entries(fields)) {
                this.dataValues[f] = Number(this.dataValues[f] || 0) + Number(n);
                this._changed.add(f);
            }
            return this.save({ fields: Object.keys(fields) });
        }
        async decrement(field, opts = {}) { return this.increment(field, { ...opts, by: -(opts.by ?? 1) }); }

        // ------------------------------------------------ static API
        static build(values = {}, opts = {}) { return new Model(values, { isNewRecord: true, ...opts }); }

        static _wrap(rows, opts = {}) {
            const ex = excludedAttrs(opts.attributes);
            return rows.map((r) => {
                const v = fromDb(Model, r);
                for (const e of ex) delete v[e];
                return opts.raw ? v : new Model(v, { isNewRecord: false, raw: true });
            });
        }

        static async findAll(opts = {}) {
            if (opts.where && hasEmptyIn(opts.where)) return [];
            const db = getDbClient();
            const select = buildSelect(Model, opts.attributes);
            const pageSize = 1000;
            const limit = opts.limit ? Number(opts.limit) : null;
            let offset = opts.offset ? Number(opts.offset) : 0;
            let all = [];
            for (;;) {
                const take = limit ? Math.min(pageSize, limit - all.length) : pageSize;
                if (take <= 0) break;
                let q = db.from(tableName).select(select);
                q = applyWhere(q, opts.where);
                q = applyOrder(q, opts.order);
                if (!opts.order) q = q.order(pk, { ascending: true });
                q = q.range(offset, offset + take - 1);
                const { data, error } = await q;
                if (error) raise(error, `select ${tableName}`);
                all = all.concat(data || []);
                if (!data || data.length < take) break;
                offset += take;
                if (limit && all.length >= limit) break;
            }
            let rows = Model._wrap(all, { ...opts, raw: false });
            if (opts.include) rows = await loadIncludes(Model, rows, opts.include);
            if (opts.raw) return rows.map((r) => r.get({ plain: true }));
            return rows;
        }
        static async findOne(opts = {}) {
            const rows = await Model.findAll({ ...opts, limit: 1 });
            return rows[0] || null;
        }
        static async findByPk(id, opts = {}) {
            if (id === null || id === undefined || id === '') return null;
            return Model.findOne({ ...opts, where: { ...(opts.where || {}), [pk]: id } });
        }
        static async count(opts = {}) {
            if (opts.where && hasEmptyIn(opts.where)) return 0;
            const db = getDbClient();
            let q = db.from(tableName).select(pk, { count: 'exact', head: true });
            q = applyWhere(q, opts.where);
            const { count, error } = await q;
            if (error) raise(error, `count ${tableName}`);
            return count || 0;
        }
        static async findAndCountAll(opts = {}) {
            const [rows, count] = await Promise.all([Model.findAll(opts), Model.count({ where: opts.where })]);
            return { rows, count };
        }
        static async create(values = {}, opts = {}) {
            const inst = Model.build(values);
            await inst.save();
            return opts.raw ? inst.get({ plain: true }) : inst;
        }
        static async bulkCreate(records = [], opts = {}) {
            if (!records.length) return [];
            const db = getDbClient();
            const rows = records.map((r) => {
                const inst = Model.build(r);
                if (createdAtCol && !inst.dataValues[createdAtCol]) inst.dataValues[createdAtCol] = new Date();
                if (updatedAtCol && !inst.dataValues[updatedAtCol]) inst.dataValues[updatedAtCol] = new Date();
                const row = toDbRow(Model, inst.dataValues);
                if (rawAttributes[pk]?.autoIncrement && (row[pk] === null || row[pk] === undefined)) delete row[pk];
                return row;
            });
            // PostgREST needs identical keys on every row of a bulk insert.
            const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
            const uniform = rows.map((r) => Object.fromEntries(keys.map((k) => [k, k in r ? r[k] : (rawAttributes[k]?.defaultValue !== undefined ? toDbValue(rawAttributes[k], rawAttributes[k].defaultValue) : null)])));
            let q;
            if (opts.updateOnDuplicate || opts.ignoreDuplicates) {
                q = db.from(tableName).upsert(uniform, { onConflict: (opts.conflictAttributes || [pk]).join(','), ignoreDuplicates: !!opts.ignoreDuplicates });
            } else {
                q = db.from(tableName).insert(uniform);
            }
            const { data, error } = await q.select();
            if (error) raise(error, `bulk insert ${tableName}`);
            return Model._wrap(data || []);
        }
        static async update(values = {}, opts = {}) {
            if (opts.where && hasEmptyIn(opts.where)) return [0, []];
            const db = getDbClient();
            const inst = new Model({}, { isNewRecord: false });
            inst.set(values);
            const patchVals = {};
            for (const k of Object.keys(values)) if (rawAttributes[k]) patchVals[k] = inst.dataValues[k];
            if (updatedAtCol && patchVals[updatedAtCol] === undefined) patchVals[updatedAtCol] = new Date();
            const patch = toDbRow(Model, patchVals);
            if (!Object.keys(patch).length) return [0, []];
            let q = db.from(tableName).update(patch);
            q = opts.where && Reflect.ownKeys(opts.where).length ? applyWhere(q, opts.where) : q.not(pk, 'is', null);
            const { data, error } = await q.select();
            if (error) raise(error, `update ${tableName}`);
            const list = Model._wrap(data || []);
            return [list.length, list];
        }
        static async destroy(opts = {}) {
            if (opts.where && hasEmptyIn(opts.where)) return 0;
            const db = getDbClient();
            let q = db.from(tableName).delete();
            q = opts.where && !(opts.where instanceof Where) && Reflect.ownKeys(opts.where).length ? applyWhere(q, opts.where)
                : opts.where instanceof Where ? applyWhere(q, opts.where) : q.not(pk, 'is', null);
            const { data, error } = await q.select(pk);
            if (error) raise(error, `delete ${tableName}`);
            return (data || []).length;
        }
        static async truncate() { return Model.destroy({ where: {} }); }
        static async findOrCreate({ where: w = {}, defaults = {}, ...rest } = {}) {
            const existing = await Model.findOne({ where: w, ...rest });
            if (existing) return [existing, false];
            const base = {};
            for (const [k, v] of Object.entries(w)) if (v === null || typeof v !== 'object' || v instanceof Date) base[k] = v;
            const created = await Model.create({ ...base, ...defaults });
            return [created, true];
        }
        static async upsert(values = {}, opts = {}) {
            const db = getDbClient();
            const inst = Model.build(values);
            if (updatedAtCol) inst.dataValues[updatedAtCol] = new Date();
            const row = toDbRow(Model, inst.dataValues);
            if (rawAttributes[pk]?.autoIncrement && (row[pk] === null || row[pk] === undefined)) delete row[pk];
            const conflict = opts.conflictFields || opts.conflictAttributes || [pk];
            const { data, error } = await db.from(tableName).upsert(row, { onConflict: conflict.join(',') }).select().single();
            if (error) raise(error, `upsert ${tableName}`);
            return [Model._wrap([data])[0], true];
        }
        static async increment(fields, opts = {}) {
            const rows = await Model.findAll({ where: opts.where });
            await Promise.all(rows.map((r) => r.increment(fields, { by: opts.by })));
            return [rows];
        }
        static async decrement(fields, opts = {}) { return Model.increment(fields, { ...opts, by: -(opts.by ?? 1) }); }
        static async max(field, opts = {}) {
            const r = await Model.findOne({ where: opts.where, order: [[field, 'DESC NULLS LAST']], attributes: [field] });
            return r ? r.dataValues[field] : null;
        }
        static async min(field, opts = {}) {
            const r = await Model.findOne({ where: opts.where, order: [[field, 'ASC NULLS LAST']], attributes: [field] });
            return r ? r.dataValues[field] : null;
        }
        static async sum(field, opts = {}) {
            const rows = await Model.findAll({ where: opts.where, attributes: [field], raw: true });
            return rows.reduce((s, r) => s + Number(r[field] || 0), 0);
        }
        static async sync() { return Model; }
        static hasMany(target, o = {}) { Model.associations[o.as || target.name] = { type: 'hasMany', target, foreignKey: o.foreignKey, as: o.as || target.name }; }
        static hasOne(target, o = {}) { Model.associations[o.as || target.name] = { type: 'hasOne', target, foreignKey: o.foreignKey, as: o.as || target.name }; }
        static belongsTo(target, o = {}) { Model.associations[o.as || target.name] = { type: 'belongsTo', target, foreignKey: o.foreignKey, as: o.as || target.name }; }
    }

    Model.rawAttributes = rawAttributes;
    Model.primaryKeyAttribute = pk;
    Model.associations = {};
    Model.options = options;
    for (const name of Object.keys(rawAttributes)) {
        Object.defineProperty(Model.prototype, name, {
            get() { return this.get(name); },
            set(v) { this.set(name, v); },
            configurable: true,
        });
    }
    registry[modelName] = Model;
    return Model;
}

export const sequelize = {
    define: defineModel,
    models: registry,
    fn, col, literal, where,
    async transaction(cb) {
        const t = { commit: async () => {}, rollback: async () => {}, afterCommit: (f) => f() };
        return typeof cb === 'function' ? cb(t) : t;
    },
    async authenticate() { return true; },
    async sync() { return true; },
    async close() { return true; },
    async query() { throw new Error('Raw SQL queries are not available; use the model API instead.'); },
    getDialect: () => 'postgres',
};

export const Sequelize = { Op, DataTypes, fn, col, literal, where, UniqueConstraintError, DatabaseError };
Sequelize.Sequelize = Sequelize;
export const QueryTypes = { SELECT: 'SELECT', UPDATE: 'UPDATE', INSERT: 'INSERT', DELETE: 'DELETE', RAW: 'RAW' };
export const Model = class {};
export default Sequelize;
