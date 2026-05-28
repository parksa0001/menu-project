import { createClient } from "@supabase/supabase-js";

export type Project = {
  id: string;
  title: string | null;
  type: string | null;
  people_count: number | null;
  created_at: string;
};

export type Vote = {
  id: string;
  project_id: string;
  participant_id: string;
  menus: string[];
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "created_at"> & {
          created_at?: string;
        };
        Update: Partial<Omit<Project, "id">>;
      };
      votes: {
        Row: Vote;
        Insert: Omit<Vote, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Vote, "id">>;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
