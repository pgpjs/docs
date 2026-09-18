# MPC

PGPJS MPC is multi-party computation for OpenPGP: split trust across parties, run threshold decrypt and sign, and keep keys off a single machine.

<section class="install-band" id="install">
  <div class="install-inner">
    <p class="install-kicker">Install PGPJS MPC</p>
    <h2>Threshold cryptography for OpenPGP.</h2>
    <div class="install-cmd">
      <code>npm install @pgpjs/mpc</code>
      <button
        type="button"
        class="install-copy"
        data-copy="npm install @pgpjs/mpc"
        title="Copy install command"
        aria-label="Copy npm install @pgpjs/mpc"
      >
        Copy
      </button>
    </div>
    <p class="install-lead">
      Paste that in a macOS Terminal, Linux shell, or Windows. Node.js 20.10 or
      newer. Then import <code>@pgpjs/mpc</code> in your app. Step-by-step
      install is on the <a href="#/mpc/install">MPC install</a> page.
    </p>
  </div>
</section>

## What you get

- Threshold key generation and reconstruct-on-use flows
- Multi-party decrypt and sign without assembling a full private key on one host
- Works next to `@pgpjs/core`, `@pgpjs/next`, and `@pgpjs/react`

Continue with [how to install MPC](install.md).
