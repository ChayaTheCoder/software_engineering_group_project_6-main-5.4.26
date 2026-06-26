var Promise = require("promise");

/**
  * FetchModel - Fetch a model from the web server.
  *     url - string - The URL to issue the GET request.
  * Returns: a Promise that should be filled
  * with the response of the GET request parsed
  * as a JSON object and returned in the property
  * named "data" of an object.
  * If the requests has an error the promise should be
  * rejected with an object contain the properties:
  *    status:  The HTTP response status
  *    statusText:  The statusText from the xhr request
  *
*/

let authToken = null;

function setAuthToken(token) {
  authToken = token;
}

function getAuthToken() {
  return authToken;
}

function fetchModel(url) {
  return new Promise(function(resolve, reject) {
      function xhrHandler() {
          if (this.readyState !== 4) {
              return;
          }
          if (this.status !== 200) {
              const error = {status: this.status, statusText: this.statusText};
              reject(new Error(error.toString()));
              return;
          }
          resolve({data: JSON.parse(this.responseText)});
      }
      const xhr = new XMLHttpRequest();
      xhr.onreadystatechange = xhrHandler;
      xhr.open("GET", url);
      if (authToken) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
      }
      xhr.send();
  });
}

export default fetchModel;
export { setAuthToken, getAuthToken };
