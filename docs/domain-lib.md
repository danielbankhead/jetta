### jetta.domainLib `OBJECT`
  - A utility for comparing and analyzing domains
  - Example:
  ```js
  jetta.domainLib.domainInOtherDomain('example.com', 'com') // true
  jetta.domainLib.domainInOtherDomain('example.com', 'example.com') // true
  jetta.domainLib.domainInOtherDomain('super.sub.example.com', 'example.com') // true
  jetta.domainLib.domainInOtherDomain('not-example.com', 'example.com') // false
  ```

  - jetta.domainLib.domainInOtherDomain(`child` STRING, `parent` STRING)
    - returns `true` if `child` is a subdomain or exact match for the `parent` - `false` in all other cases

    - `child` STRING - the domain to check if in `parent`
    - `parent` STRING - the parent domain

    - _return_ BOOLEAN
