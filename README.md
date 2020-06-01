# qengine
A questionnaire engine built using NodeJS for second year Web Progamming coursework.
## Installation Instructions
QEngine requires Node.js, and may be installed and run in two commands:
```
npm install
```
```
npm start
```
The app will then be running on port `8080`. If you are running locally, you can access this in your browser on `localhost:8080`.
## API Overview
The API can be broken down into the following routes:

**method** | **route** | **response (if valid request)** | **description** | **error case**
--- | --- | --- | --- | ---
GET | /questionnaires | Object containing all stored questionnaires. | - | Will respond `{[]}` if no questionnaires are found or status code `400` if there is an error.
GET | /questionnaireInfo | Object containing the id, name, visibility and ownership of all questionnaires matching user access rights. | Assumes user is not authenticated. | Will respond `{[]}` if no questionnaires are found or status code `400` if there is an error.
GET | /questionnaireInfo/:token | Object containing the id, name, visibility and ownership of all questionnaires matching user access rights. | Assumes user is authenticated with the given token (*see Tokens*) | Will respond `{[]}` if no questionnaires are found or status code `400` if there is an error.
GET | /questionnaireInfo/:token/lim/:limit | Object containing the id, name, visibility and ownership of lim-many questionnaires matching user access rights, in no particular order. | Assumes user is authenticated with the given token (*see Tokens*) | Will respond `{[]}` if no questionnaires are found or status code `400` if there is an error. 
GET | /questionnaireInfo/lim/:limit | Object containing the id, name, visibility and ownership of lim-many questionnaires matching user access rights, in no particular order. | Assumes user is not authenticated | Will respond `{[]}` if no questionnaires are found or status code `400` if there is an error.
GET | /questionnaires/:id | Object containing the id, name, visibility and associated questions of the questionnaire matching the provided id. | - | Will return error code, response.text() contains explanation of why. Throws status code `404` if questionnaire is not found.
GET | /responses/:id | Array containing all responses to a questionnaire matching the provided id. Each element of the array is an object, where obj\[question_id\] corresponds to a question with id `question_id`. | Assumes that the user is not authenticated. | Will return error code, response.text() contains explanation of why. Will respond `[]` if no responses are found, but will return status code `404` if no questionnaire is found.
GET | /responses/:id/:token | Array containing all responses to a questionnaire matching the provided id. Each element of the array is an object, where obj\[question_id\] corresponds to a question with id `question_id`. | Assumes that the user is authenticated with the given token. | Will return error code, response.text() contains explanation of why. Will respond `[]` if no responses are found, but will return status code `404` if no questionnaire is found.
POST | /questionnaires | The ID of the questionnaire created. | Questionnaire matching the structure of an object in req.body is added to the database. User authentication token is stored in req.body.token. Assumes that the user is authenticated with the given token. | Will return error code, response.text() contains explanation of why. 
POST | /responses/:id | An object, `{valid: true}` | Response for questionnare matching the provided ID matching the structure of an object in req.body is added to the database. User authentication token is stored in req.body.token. Assumes that the user is authenticated with the given token. | Will return error code, response.text() contains explanation of why. 
PUT | /questionnaires/:id | An integer, representing the HTTP Status code | Questionnaire matching the id provided is updated in the database, using data found in the structure of an object in req.body. Route assumes user is not authenticated. | Will return error code, response.text() contains explanation of why. 
PUT | /questionnaires/:id/:token | An integer, representing the HTTP Status code | Questionnaire matching the id provided is updated in the database, using data found in the structure of an object in req.body. Route assumes user is authenticated with the provided token. | Will return error code, response.text() contains explanation of why. 
DELETE | /questionnaires/:id | HTTP Status Code `200`, A string, `"OK"` | Questionnaire matching the id provided is deleted from the database. Route assumes user is not authenticated. | Will return error code, response.text() contains explanation of why. 
DELETE | /questionnaires/:id/:token | HTTP Status Code `200`, A string, `"OK"` | Questionnaire matching the id provided is deleted from the database. Route assumes user is authenticated with the provided token. | Will return error code, response.text() contains explanation of why. 

## Assumptions made
- All users of the client organisation have a Google account.

## Why are things the way they are?
### ECMAScript modules
All client code utilises ECMAScript module support. This allows code to be reused in multiple places without it being repeated, improving maintainability should the functionality of that code need to be tweaked in any form.

Modules include:
- **auth**: Used for helper functions pertaining to Google Authentication.
- **editor**: Used for the  implementation of the GUI editor for questionnaires. Allows the editor to be ran in `create` or `edit` mode based on whether it is being ran from `client/create.js` or `client/edit.js`.
- **graph**: Used to create the `<custom-bar-graph>` element used in `client/responses.js`.
- **interface**: Used for helper functions pertaining to the user interface such as loading display or hiding/showing elements.
- **url**: Used to generate URLs to other pages in the application.

### waitForAuth()
This is the only 'hacky' workaround that I have had no choice but to use in this application.

Before authentication was implemented, window load events were used as the starting point for a given page's code.

After authentication was implemented, window load events were no longer sufficient. These created race conditions in the application, where Google Authentication and my own code would be loaded simultaneously. Should authentication load first, the code would behave normally. Should authentication load second, the code would not know whether or not the user is logged in.

OK, so why not use `gapi.onSignIn` events that refresh the page with "authenticated content" on login/logout? Well, these create a different race condition where Google Authentication (including login) may have occured before the `onSignIn` listener was initialised, therefore missing the event and never loading the app.

OK, so why not use the `onload` URLSearchParameter (i.e. `"https://apis.google.com/js/platform.js?onload=onLoadCallback"`) to load the code of the page after Google Authentication has loaded? As I'm using ECMAScript modules, this is not an option as a "onLoadCallback()" method would be out of scope.

OK, so why not use `gapi.load('auth2', onPageLoad);`? This one seemed like the solution. However, due to yet another race condition - if my code loaded before Google Authentication finished - there would be a case where gapi is undefined.

There arrives my workaround, I use a try-catch statement that will catch if gapi is undefined and try again in 1 second if it is undefined.

### Login
The user should not have to login.

Without being logged in, the user can still create a questionnaire and view responses to it. However, they may not edit the questionnaire once it has been created (otherwise everyone could edit it).

The application itself does not have a "sign up" form. It doesn't need one (see below for explanation).

*Why only Google login?* See assumptions.

*What data is being held?* The only "identifiable data" being passed to the server is the user's ID and the user's ID is unique to this application. This way, I have minimal interaction with the user's personal data. (I don't care about when their birthday is, why should I?)

### Community Questionnaires
A user has the ability to designate their questionnaire as being available for anyone, regardless for whether or not they have the direct link to the questionnaire. Should they choose to do so, it has the chance to appear on the homepage (`index.html`) for other users to respond to if they wish.

A possible use case here would be for Dissertation Questionnaires. For example, this could be deployed in the university for all students to access. A student would be able to create, edit and view responses to their questionnaire(s) as well as being able to respond and view responses to other students's questionnaires. This could allow for greater data collection, but comes with the caveat of moderation and responses being publicly available.

A "missing feature" from this is a lack of moderation tools. Someone could title their questionnaire with a derogatory title, and it would have equal chance to appear on the homepage without any ability for the end user or the system to remove it. In terms of coursework, implementing moderation tools would overcomplicate the system but in a public system this would have to be implemented.

### Support for extra question types
Whilst I haven't implemented any additional question types, the system allows for this to occur.

To implement a new question type:
- Add question type to QUESTION_TYPES object in `server/validate.js`. This object acts as a way to generically handle response validation without creating a validation case for each type (hence, improving maintainability).
- Add support for GUI editing in `client/lib/editor.js`. This requires the necessary element(s) being added to `client/create.html` and `client/edit.html` with retrieval in `editor.js getFormData()`.
- OPTIONAL - Add CSS in `client/css/main.css` if necessary.

### Want extra test data?
Use the examples in `json.html` (although any questionnaire by the specification provided should work).