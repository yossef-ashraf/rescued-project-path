import { Op } from '@/shared/database/orm.js';
import JobRun from '@/shared/models/JobRun.js';
import JobLock from '@/shared/models/JobLock.js';

/**
 * Orbit Architecture v2 — Unified Job Service
 * Provides distributed locks and reliable job tracking for background operations
 * (Backups, Telegram sync, Export jobs, Scheduled reminders).
 */

export async function acquireLock(lockKey, ttlSeconds = 60, lockedBy = 'worker') {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    try {
        // Remove expired locks for this key first
        await JobLock.destroy({
            where: {
                lock_key: lockKey,
                expires_at: { [Op.lt]: now }
            }
        });

        // Attempt to create new lock
        await JobLock.create({
            lock_key: lockKey,
            locked_by: lockedBy,
            expires_at: expiresAt
        });

        return true;
    } catch (_) {
        // Lock already held
        return false;
    }
}

export async function releaseLock(lockKey, lockedBy = 'worker') {
    try {
        await JobLock.destroy({
            where: {
                lock_key: lockKey,
                locked_by: lockedBy
            }
        });
        return true;
    } catch (err) {
        console.error(`[JobService] Failed to release lock ${lockKey}:`, err?.message);
        return false;
    }
}

export async function runJob(jobName, payload, taskFn, options = {}) {
    const { lockTtl = 300, workerId = 'system' } = options;
    const lockKey = `job:${jobName}`;

    const acquired = await acquireLock(lockKey, lockTtl, workerId);
    if (!acquired) {
        return {
            executed: false,
            reason: `Job '${jobName}' is currently locked by another process`
        };
    }

    const jobRecord = await JobRun.create({
        job_name: jobName,
        status: 'running',
        attempts: 1,
        payload: payload || null,
        started_at: new Date()
    });

    try {
        const result = await taskFn();

        await jobRecord.update({
            status: 'completed',
            result: result || null,
            completed_at: new Date()
        });

        return {
            executed: true,
            jobId: jobRecord.id,
            status: 'completed',
            result
        };
    } catch (error) {
        await jobRecord.update({
            status: 'failed',
            error_message: error?.message || 'Unknown error occurred',
            completed_at: new Date()
        });

        throw error;
    } finally {
        await releaseLock(lockKey, workerId);
    }
}

const serviceExports = {
    acquireLock,
    releaseLock,
    runJob
};

export default serviceExports;
