import Butter from 'buttercms';

export const butterClient = Butter(process.env.NEXT_PUBLIC_BUTTERCMS_API_KEY || '');