# MMM-NFL Changelog

## [Unreleased]

### Fixed

### Added

### Changed

### Removed

## 1.3.1

### Fixed

- [Config option `focus_on` didn't filter match list](https://github.com/fewieden/MMM-NFL/issues/55)

### Removed

- TravisCI integration

## 1.3.0

MagicMirror² version >= 2.15.0 required.

### Added

* Nunjuck templates
* Remote team logos
* Readded live game fetching
* More statistic types
* Integrated MagicMirror logger on server side
* Integrated [MMM-Modal](https://github.com/fewieden/MMM-Modal)
* Implemented suspend, resume and stop behavior
* Added instructions for global config options
* Github actions: `changelog` and `build`
* Github config files

### Changed

* Data structure
* Dimmed bye week
* Project config files
* Dependency updates
* Preview pictures

### Removed

* API provider: NFL XML API
* Local team logos
* Config option: `helmets`

## [1.2.1]

### Added

* Ball possession support for API provider ESPN
* Redzone support for API provider ESPN

### Fixed

* Ball possession team if config option `reverseTeams` is set to `false`

## [1.2.0]

### Added

* New API provider: ESPN

## [1.1.1]

### Fixed

* Bye week translation https://github.com/fewieden/MMM-NFL/issues/37

## [1.1.0]

### Fixed

* Data source
* Installation instructions

### Added

* Config option `tableSize` to specify font size of table.
* Config option `reverseTeams` to invert the display order of home and away team.
* Display of week in header.
* package-lock.json
* Pro bowl mode

### Changed

* Updated icons
* Start in regular mode

### Removed

* team renaming

## [1.0.0]

Initial version
