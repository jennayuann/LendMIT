---
timestamp: 'Thu Oct 16 2025 04:47:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_044736.bf5c4f5d.md]]'
content_id: c7929c20ec697730fbfed8b3edba59f1bdcc33d08fc6806e58c83ffa141bd7ac
---

# concept: LikertSurvey

* **concept**: LikertSurvey \[Author, Respondent]
* **purpose**: To measure attitudes or opinions by asking respondents to rate their level of agreement with a series of statements on a predefined scale.
* **principle**: If an author creates a survey with several questions on a 1-5 scale, and a respondent submits their answers to those questions, then the author can view the collected responses to analyze the respondent's opinions.
* **state**:
  * A set of `Surveys` with
    * an `author` of type `Author`
    * a `title` of type `String`
    * a `scaleMin` of type `Number`
    * a `scaleMax` of type `Number`
  * A set of `Questions` with
    * a `survey` of type `Survey`
    * a `text` of type `String`
  * A set of `Responses` with
    * a `respondent` of type `Respondent`
    * a `question` of type `Question`
    * a `value` of type `Number`
* **actions**:
  * `createSurvey (author: Author, title: String, scaleMin: Number, scaleMax: Number): (survey: Survey)`
    * **requires**: `scaleMin < scaleMax`
    * **effects**: Creates a new survey with the given author, title, and scale.
  * `addQuestion (survey: Survey, text: String): (question: Question)`
    * **requires**: The survey must exist.
    * **effects**: Adds a new question to the specified survey.
  * `submitResponse (respondent: Respondent, question: Question, value: Number)`
    * **requires**: The question must exist. The respondent must not have already submitted a response for this question. The value must be within the survey's scale.
    * **effects**: Records the respondent's answer for the given question.
  * `updateResponse (respondent: Respondent, question: Question, value: Number)`
    * **requires**: The question must exist. The respondent must have already submitted a response for this question. The value must be within the survey's scale.
    * **effects**: Updates the respondent's existing answer for the given question.
