'use client';

import { useState, useCallback, useMemo } from 'react';
import { validateSchema } from '@/shared/schemas/validator';

/**
 * useForm
 * Architecture v2 Unified Form State Management Hook
 */
export function useForm({
    initialValues = {},
    schema = null,
    onSubmit = async () => {}
}) {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isDirty = useMemo(() => {
        return Object.keys(values).some((k) => values[k] !== initialValues[k]);
    }, [values, initialValues]);

    const setFieldValue = useCallback((name, value) => {
        setValues((prev) => ({ ...prev, [name]: value }));
        setTouched((prev) => ({ ...prev, [name]: true }));

        // Clear error for field on change if schema provided
        if (schema && errors[name]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }, [schema, errors]);

    const handleBlur = useCallback((name) => {
        setTouched((prev) => ({ ...prev, [name]: true }));
        if (schema) {
            const validation = validateSchema(schema, values);
            if (validation.errors && validation.errors[name]) {
                setErrors((prev) => ({ ...prev, [name]: validation.errors[name] }));
            }
        }
    }, [schema, values]);

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    const handleSubmit = useCallback(async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Validate full schema if present
        if (schema) {
            const validation = validateSchema(schema, values);
            if (!validation.valid) {
                setErrors(validation.errors || {});
                return false;
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit(values);
            setIsSubmitting(false);
            return true;
        } catch (err) {
            setIsSubmitting(false);
            setErrors((prev) => ({
                ...prev,
                _form: err?.message || 'فشلت عملية الحفظ، يرجى المحاولة لاحقاً'
            }));
            return false;
        }
    }, [schema, values, onSubmit]);

    return {
        values,
        errors,
        touched,
        isDirty,
        isSubmitting,
        setFieldValue,
        handleBlur,
        resetForm,
        handleSubmit,
        setValues,
        setErrors
    };
}

export default useForm;
