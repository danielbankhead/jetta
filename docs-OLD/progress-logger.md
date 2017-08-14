### `jetta.ProgressLogger` CLASS
  - jetta's native STDOUT streaming progress logger
  - can use be used:
    - In `jetta.request` via `options.useDefaultProgressLogger = true`
      - convenient
    - In `jetta.request` via `options.progressLog = new ProgressLogger()`
      - useful if you want to re-use multiple requests
    - Outside of `jetta.request`, for any of your progress logging needs
  - Example:
  ```js
  const progressLogger = new jetta.ProgressLogger()
  ```

  - _new_ ProgressLogger ()
    - Example:
    ```js
    const progressLogger = new jetta.ProgressLogger()
    ```

    - _instance_ OBJECT
      - `longestLineLength` INTEGER
        - the length of the longest line of the output
      - `linesWrote` INTEGER
        - number of lines wrote
      - `finished` BOOLEAN
        - true if a `log`'s `current` met of exceeded the `total`

      - `log` (options)
        - logs progress to STDOUT
        - Example:
        ```js
        const progressLogger = new jetta.ProgressLogger()
        progressLogger.log({current: 10, total: 125, name: 'example.com'})
        ```

        - `options` OBJECT
          - `current` INTEGER
            - the current progress amount
          - `total` INTEGER
            - the total to be
          - `name` STRING
            - an identifier, preferably a URL, for the progress log line

      - `reset` ()
        - resets `longestLine`, `linesWrote`, and `finished`
