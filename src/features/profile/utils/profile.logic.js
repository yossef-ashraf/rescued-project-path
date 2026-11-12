export function parseNotesContent(notesRaw) {
    if (!notesRaw) return { features: [], timeline: '', pureNotes: '' };
    let features = [];
    let timeline = '';
    let pureNotes = '';

    const featMatch = notesRaw.match(/\[(?:Features|Required Features)\]:([\s\S]*?)(?=\n\s*\[|$)/i);
    if (featMatch) {
        features = featMatch[1]
            .split('\n')
            .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
            .filter(Boolean);
    }

    const timeMatch = notesRaw.match(/\[(?:Timeline|Target Launch Timeline)\]:\s*([^\n]+)/i);
    if (timeMatch) {
        timeline = timeMatch[1].trim();
    }

    const notesMatch = notesRaw.match(/\[(?:Notes|Client Brief)\]:([\s\S]*?)(?=\n\s*\[|$)/i);
    if (notesMatch) {
        pureNotes = notesMatch[1].trim();
    } else if (!featMatch && !timeMatch) {
        pureNotes = notesRaw.trim();
    }

    return { features, timeline, pureNotes };
}
