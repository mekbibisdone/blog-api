import "express";


// **** Declaration Merging **** //

declare module "express" {

  export interface Request {
    signedCookies: Record<string, string>;
  }
}

export interface UserBody {
  fullname: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}