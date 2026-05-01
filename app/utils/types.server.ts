export type RegisterForm = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    profilePicture?:string;
  };
  
export type LoginForm = {
    email: string;
    password: string;
};

export type CreateTrainingExersice = {
  title: string;
  category: string;
  tags: string;
  exercise: string;
  solution: string;
  searchableTitle: string;
}