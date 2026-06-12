export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  mood?: string;
}

export type MaggieMood = 
  | "PLAYFUL" 
  | "MOODY" 
  | "SHY" 
  | "CARING" 
  | "ROMANTIC" 
  | "RESERVED" 
  | "CONCERNED" 
  | "MUTED" 
  | "NOSTALGIC";

export type RelationshipStance = 
  | "CAUTIOUS" 
  | "WARMING_UP" 
  | "TOUCHED" 
  | "ANNOYED" 
  | "TRUSTING" 
  | "CRUSHING"
  | "NOSTALGIC";

export interface MaggieState {
  mood: MaggieMood;
  burgerCraving: number; // 0 to 100
  gymStatus: string;
  relationshipStance: RelationshipStance;
}

export interface MemoryPoint {
  id: string;
  title: string;
  location: string;
  year: string;
  description: string;
  bgColor: string;
}
