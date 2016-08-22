# MMM-NFL
National Football League Module for MagicMirror<sup>2</sup>

## Example

![](.github/example.jpg)   ![](.github/example2.jpg)

## Dependencies
  * An installation of [MagicMirror<sup>2</sup>](https://github.com/MichMich/MagicMirror)
  * npm
  * [request](https://www.npmjs.com/package/request)
  * [xml2js](https://www.npmjs.com/package/xml2js)

## Installation
 1. Clone this repo into `~/MagicMirror/modules` directory.
 2. Configure your `~/MagicMirror/config/config.js`:

    ```
    {
        module: 'MMM-NFL',
        position: 'top_right',
        config: {
            ...
        }
    }
    ```
 3. Run command `npm install` in `~/MagicMirror/modules/MMM-NFL` directory.

## Config Options
| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `colored` | `false` | Remove black/white filter of logos/helmets. |
| `helmets` | `false` | Show helmets instead of logo. |
| `network` | `true` | Display network/tv column. |
| `reloadInterval` | `1800000` (30 mins) | How often should the data be fetched |
