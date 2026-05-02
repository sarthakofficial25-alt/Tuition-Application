// Single source of truth for classes and subjects offered by the coaching centre.
// Update this file to reflect changes on the Landing page — the Homework page will pick them up automatically.

export const CLASS_DATA = [
    { id: '4', label: 'Class 4', subjects: ['Mathematics', 'Science', 'Computer'] },
    { id: '5', label: 'Class 5', subjects: ['Mathematics', 'Science', 'Computer'] },
    { id: '6', label: 'Class 6', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer'] },
    { id: '7', label: 'Class 7', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer'] },
    { id: '8', label: 'Class 8', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer'] },
];

// All unique subjects across every class, plus 'Others' for miscellaneous tasks
export const ALL_SUBJECTS = [...new Set(CLASS_DATA.flatMap(c => c.subjects)), 'Others'];

// All class IDs  e.g. ['4','5','6','7','8']
export const ALL_CLASS_IDS = CLASS_DATA.map(c => c.id);
