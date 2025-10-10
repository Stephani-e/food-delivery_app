export const validateForm = (form: Record<string, any>, requiredFields: string[]) => {
    const missing: string[] = [];

    requiredFields.forEach((field) => {
        if (!form[field] || form[field].trim() === "") {
            missing.push(field);
        }
    });

    return missing;
};
