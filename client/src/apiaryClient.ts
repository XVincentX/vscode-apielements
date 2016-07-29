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

export class ApiaryClient {

  constructor(token: string) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios.defaults.headers.common["Authentication"] = `Token ${token}`;
    axios.defaults.baseURL = "https://api.apiary.io/";
  }

  getApiList(): Thenable<Array<Api>> {
    return axios.get('me/apis').then(result => {
      return result.data.apis;
    });
  }

  getApiCode(apiName: string): Thenable<any> {
    return axios.get(`blueprint/get/${apiName}`).then(result => {
      return result.data;
    });
  }

  publishApi(apiName: string, code: string): Thenable<string> {
    return Promise.resolve("");
  }
}
