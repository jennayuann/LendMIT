---
timestamp: 'Thu Oct 16 2025 15:22:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_152218.239134b2.md]]'
content_id: 34d2917a53d6993cbef21a3a14663c97ff6db6dc7e0c1b0a85657a12438a8c83
---

# New Request: Iterate on above response.

Currently, there is a lot of repetition, be more concise. Also, expand on the following, tying in the token example from the psets (context given below):
**"Typically email auth is also not its own concept (remember the token example from the psets?)."**
\*   **Response**: The `EmailAuth` concept was merged directly into `UserAuthentication`. This eliminates a separate concept and ensures `UserAuthentication` is complete in managing its entire lifecycle, including verification.

## Token example from pset:

## Exercise 2: Extending a familiar concept

In this exercise, you’ll complete the description of a familiar concept: authentication of users with passwords. You’ll also use this concept specification in the next exercise.

  **concept** PasswordAuthentication\
  **purpose** limit access to known users\
  **principle** after a user registers with a username and a password,\
    they can authenticate with that same username and password\
    and be treated each time as the same user\
  **state**\
    a set of Users with …\
  **actions**\
    register (username: String, password: String): (user: User)\
      …\
    authenticate (username: String, password: String): (user: User)\
      …

### Questions

1. Complete the definition of the concept state.
2. Write a requires/effects specification for each of the two actions. (*Hints*: The register action creates and returns a new user. The authenticate action is primarily a guard, and doesn’t mutate the state.)
3. What essential invariant must hold on the state? How is it preserved?
4. One widely used extension of this concept requires that registration be confirmed by email. Extend the concept to include this functionality. (*Hints*: you should add (1) an extra result variable to the register action that returns a secret token that (via a sync) will be emailed to the user; (2) a new confirm action that takes a username and a secret token and completes the registration; (3) whatever additional state is needed to support this behavior.)

**Deliverables**: Succinct answers to each of the questions with the required additional specification fragments.

## Exercise 3: Comparing concepts

One way to improve your understanding of concept design is to compare related concepts, and try to determine (and then articulate) how and why they differ. Confusion between related concepts can be a design flaw in itself, when the designer fails to convey (through the user interface and support materials) what concept is being offered in a particular situation.

> For example, X/Twitter used to have a feature called “favorites,” but it wasn’t clear if this was an instance of an Upvoting concept (which collected votes from users for popularity ranking) or a Favoriting (or Bookmarking) concept (which let users save favorite tweets). In 2015, Twitter renamed “favorites” to “likes” and replaced the yellow star icon with a red heart, explaining in a press release “We are changing our star icon for favorites to a heart and we’ll be calling them likes… We know that at times the star could be confusing, especially to newcomers. You might like a lot of things, but not everything can be your favorite.” Needless to say, this didn’t help explain what concept was actually at play, and in 2017, Melania Trump famously “liked” a tweet that taunted her husband, presumably believing that she was bookmarking it, when in fact her “like” was shown publicly as a gesture of approval. In 2018, Twitter finally added a Bookmark concept.

> In this case, it seems possible that the confusion was intentional, since public likes, unlike private bookmarks, serve the company’s business goals of increasing visible user engagement (and indeed, even after they were added, the bookmarking actions were buried in the user interface and far harder to access than the upvoting actions). In other cases, confusion between concepts is simply a consequence of poor design, and even with good design it is not possible to ensure complete clarity for all users given their diversity of background and assumptions.

### Passwords vs. Personal Access Tokens

GitHub offers a form of authentication called [personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). This is described as “an alternative to using passwords.” [Creating a token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) sounds very much like creating a password with a strong password helper: you click a button to create a token, and get an obscure string which you can then save. [Using a token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#using-a-personal-access-token-on-the-command-line) appears to be the same as using a password: you enter a username and the token string, and will then be authenticated if the string matches the one that was generated when the token was created. Moreover, at the very start of the [article](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) we are told “Treat your access tokens like passwords.”

So what exactly is the difference between the standard *PasswordAuthentication* concept and the *PersonalAccessToken* concept? Read the Github page carefully, and write a minimal specification of the *PersonalAccessToken* concept, paying particular attention to the purposes and operational principle. Now consider how the two concepts differ. Finally, say briefly whether you think the GitHub page could be improved, and if so how.

*Note*: consider only “personal access tokens (classic)” and not “fine-grained personal access tokens.”

**Deliverables**: a concept specification for *PersonalAccessToken* and a succinct note about how it differs from *PasswordAuthentication* and how you might change the GitHub documentation to explain this.

***
