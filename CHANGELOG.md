# Change Log

All notable changes to the "ts-type-expand" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.0.11] - 2021-09-10

### Changed

- Fixed problem with dependency resolution failing on case-sensitive machines.
- Do not display an error when the file extension is not ts or tsx.

## [0.0.9] - 2021-09-04

### Added

- added error messages after error occured

### Changed

- `ts-type-expand.refresh` renamed `ts-type-expand.restart`
  - restart compilerAPI after command executed
  - update configure after command executed
- Upgrade typescript version to 4.4.2
- Upgrade dependecy versions

## [0.0.8] - 2021-05-31

### Added

- Support enum expansion
