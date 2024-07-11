import { getPublishedVersion } from 'get-published-version'
import npmBump from 'npm-bump'
import pkq from './package.json' with { type: "json" }

const version = pkq.version

getPublishedVersion('fireborm')
  .then(published => {
    console.log({
      current: { type: typeof version, v: version },
      published: { type: typeof published, v: published },

    })
    if (version === published) npmBump('patch')
  })
// npmBump(releaseType)