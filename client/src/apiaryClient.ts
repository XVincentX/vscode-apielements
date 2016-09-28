import axios from 'axios';


interface Api {
  apiName: string;
  apiSubdomain: string;
  apiDocumentationUrl: string;
  apiIsPrivate: boolean;
  apiIsPublic: boolean;
  apiIsTeam: boolean;
  apiIsPersonal: boolean;
}

interface ApiResult {
  apis: Array<Api>;
}

export class ApiaryClient {

  constructor(token: string) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    axios.defaults.headers.common.Authentication = `Token ${token}`;
    axios.defaults.baseURL = "https://api.apiary.io/";
  }


  public getApiList(): Thenable<ApiResult> {
    return axios.get('me/apis')
      .then(this.getDataObject, this.formatError);
  }

  public getApiCode(apiName: string): Thenable<any> {
    return axios.get(`blueprint/get/${apiName}`)
      .then(this.getDataObject, this.formatError);
  }

  public publishApi(
    apiName: string,
    code: string,
    commitMessage: string = "Saving API Description Document from VSCode"): Thenable<any> {
    return axios.post(`blueprint/publish/${apiName}`, {
      code,
      messageToSave: commitMessage,
      shouldCommit: true,
    }).then(undefined, this.formatError);
  }

  private getDataObject = res => res.data;
  private formatError = err => {
    if (err.response !== undefined) {
      if (err.response.data.parserError !== undefined) {
        throw new Error(err.response.data.parserError);
      } else if (err.response.data.message !== undefined) {
        throw new Error(err.response.data.message);
      }
    }

    throw err;
  };
}
