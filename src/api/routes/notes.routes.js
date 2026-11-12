import { NotesController } from '@/features/learning/controllers/NotesController.js';

export const notesRoutes = {
  'notes': {
    GET: (req) => NotesController.getNotes(req),
    POST: (req) => NotesController.handlePost(req),
    PUT: (req) => NotesController.handlePost(req),
    PATCH: (req) => NotesController.handlePost(req),
    DELETE: (req) => NotesController.deleteNote(req)
  }
};
