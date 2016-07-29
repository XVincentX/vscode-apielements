const axios = require("axios");


interface Api {
  name: string,
  description : string
};

export class ApiaryClient {

  private token : string;

  constructor(token : string) {
    this.token = token;
  }

  getApiList() : Thenable<Array<Api>> {
    return Promise.resolve([{name:"Nasino", description:"baffo"}]);
  }

  getApiCode(apiName : string) : Thenable<string> {
    return Promise.resolve("");
  }

  publishApi(apiName : string, code : string) : Thenable<string> {
    return Promise.resolve("");
  }
}
