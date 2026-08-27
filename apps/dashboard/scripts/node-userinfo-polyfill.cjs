// Some restricted Windows service accounts make uv_os_get_passwd fail even
// though the application itself can run. tsx only needs a stable temp suffix.
const os = require('node:os')
try {
  os.userInfo()
} catch {
  os.userInfo = () => ({
    username: process.env.USERNAME || 'clickify-test',
    uid: -1,
    gid: -1,
    shell: null,
    homedir: process.env.USERPROFILE || process.cwd()
  })
}
