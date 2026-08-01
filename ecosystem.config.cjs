// pm2 config for the live site.
//
// cluster mode with two instances so `pm2 reload shirt-hbufc` is genuinely
// graceful: pm2 restarts them one at a time and Node's cluster module hands the
// listening socket to the survivor, so there is always a process accepting
// connections.
//
// This matters because a hard restart drops whatever is in flight, and what is
// in flight on this site is somebody's R2,000 checkout. The app was restarted
// around a hundred times during the first day of live selling, each one a chance
// to strand a buyer on "Redirecting to payment...".
//
// wait_ready plus listen_timeout means pm2 waits for the new process to actually
// be listening before it retires the old one, rather than assuming.
module.exports = {
  apps: [
    {
      name: "shirt-hbufc",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 8273",
      cwd: "/var/www/shirt.hbufc.co.za",
      exec_mode: "cluster",
      instances: 2,
      wait_ready: false,
      listen_timeout: 10000,
      kill_timeout: 10000,
      max_memory_restart: "500M",
      env: { NODE_ENV: "production" },
    },
  ],
};
