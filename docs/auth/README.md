# Login

<p class="blog-kicker">Blackeye token login</p>

Sign in with a **PGP ID** and **Code ID**. After you submit, the site opens `/auth/{pgpid}/{codeid}` — that URL is the login.

This login is the PGPJS port of [BlackeyE 3.1](https://github.com/EricksonAtHome/BlackeyE3.1): token-gated access. Create a token first on the [make a token](/auth/token) page.

<form class="blackeye-login" data-blackeye-login>
  <label for="blackeye-pgpid">PGP ID</label>
  <input id="blackeye-pgpid" name="pgpid" autocomplete="username" spellcheck="false" placeholder="token from pig create token" />
  <label for="blackeye-codeid">Code ID</label>
  <input id="blackeye-codeid" name="codeid" type="password" autocomplete="current-password" placeholder="optional password, or -" />
  <button type="submit">login</button>
  <p class="blackeye-login-status" hidden></p>
</form>

Do not post a live `/auth/{pgpid}/{codeid}` link in public chat. Treat it like a password.
