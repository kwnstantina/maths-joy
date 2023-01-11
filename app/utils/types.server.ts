export type RegisterForm = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
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
}