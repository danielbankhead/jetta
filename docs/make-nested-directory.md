### jetta.makeNestedDirectory `FUNCTION`
  - A simple utility for creating nested directories, creating them where they do not exist
  - Used internally by other jetta features and tests, but exposed for your convenience
  - Example:
  ```js
  jetta.makeNestedDirectory(path.join('example', 'new', 'nested', 'directory'))
  ```

  - jetta.makeNestedDirectory(`path` STRING[, `options` OBJECT])
    - `path` STRING - the path (full or relative) to create
    - `options` OBJECT
      - `preferredErrorLanguage` STRING - as an [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
