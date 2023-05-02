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

export type UploadExersiceForm = {
  title:string;
  category:string;
  fileContentType:string;
  file:File |any;
  tags:string;
  description:string,
  exerciseImgUrl:string,
}

export type CreateTrainingExersice = {
  title:string;
  category:string;
  tags:string;
  exercise: string;
  solution:string;
  searchableTitle:string;
}