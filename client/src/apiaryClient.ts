const axios = require("axios");


interface Api {
  apiName: string,
  apiSubdomain: string,
  apiDocumentationUrl: string
  apiIsPrivate: boolean,
  apiIsPublic: boolean,
  apiIsTeam: boolean,
  apiIsPersonal: boolean
}

interface ApiResult {
  apis: Array<Api>
}

export class ApiaryClient {

  constructor(token: string) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios.defaults.headers.common["Authentication"] = `Token ${token}`;
    axios.defaults.baseURL = "https://api.apiary.io/";
  }

  private getDataObject = res => res.data;

  getApiList(): Thenable<ApiResult> {
    return axios.get('me/apis').then(this.getDataObject);
  }

  getApiCode(apiName: string): Thenable<any> {
    return axios.get(`blueprint/get/${apiName}`).then(this.getDataObject);
  }

  publishApi(apiName: string, code: string): Thenable<string> {
    return Promise.resolve("");
  }
}
