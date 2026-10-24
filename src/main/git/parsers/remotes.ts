/** Parses the remotes section of `git config`. Pure: no I/O. */

/** Parses `git config --get-regexp '^remote\..*\.url$'` into `{ name, url }` pairs. */
export function parseRemoteConfig(output: string): { name: string; url: string }[] {
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [key, ...rest] = line.split(' ')
      return { name: key.replace(/^remote\./, '').replace(/\.url$/, ''), url: rest.join(' ') }
    })
}
