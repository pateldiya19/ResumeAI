export interface ProjectInput {
  title: string;
  description: string;
  techStack: string[];
  liveUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  isHighlighted?: boolean;
}

export interface ProjectResponse extends ProjectInput {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
