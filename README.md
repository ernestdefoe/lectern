# Lectern

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/ernestdefoe/lectern.svg)](https://packagist.org/packages/ernestdefoe/lectern)

A [Flarum](https://flarum.org) 2 extension that lets readers open PDF attachments right inside the post, so they don't have to download them first.

- **Works with FoF Upload**: every PDF uploaded with [FoF Upload](https://github.com/FriendsOfFlarum/upload) gets a **View** button, including PDFs posted before Lectern was installed. There is also a new **PDF viewer** template that shows the file as a card with its name, size, View and Download.
- **Works with plain links** to a PDF on your own forum, from any editor: Markdown, BBCode or a rich text editor.
- **A real viewer**: page thumbnails, search with highlighted matches, zoom, page navigation, print, download and full screen.
- **Phones**: pinch to zoom, swipe sideways to turn the page, and a full-screen viewer that sits above the Mobile Tab bar.
- **Keyboard and screen readers**: every control is labelled, the page and search results are announced, and the keys you would expect work (Page Up/Down, arrows, Home/End, +, −, 0, Ctrl+F, Escape).

## Light by design

The viewer is [pdf.js](https://mozilla.github.io/pdf.js/), Mozilla's PDF engine, and it loads **only when someone opens a PDF**. A page without an open PDF carries about 3.4 KB (gzipped) more than it did without Lectern, makes no extra requests, and the forum runs no extra queries.

## Private by design

- **Files never leave your forum.** No Google or Microsoft viewers, no CDN, no third-party calls. pdf.js, its worker, fonts and decoders are served from your own forum.
- **Only your own files.** Links to PDFs on other sites stay normal links.
- **FoF Upload's permissions apply.** Files are fetched through FoF Upload's own download address, with the reader's own session, so the download permission (and per-tag download permission) decides who can view a file. Readers who can't download a file don't get a View button.
- **No PDF JavaScript.** Scripts, forms (XFA) and link actions inside a PDF are never run. Only the page images and the text are shown.

## Installation

```sh
composer require ernestdefoe/lectern
php flarum migrate
php flarum cache:clear
```

## Updating

```sh
composer update ernestdefoe/lectern
php flarum migrate
php flarum cache:clear
```

Clearing the cache also publishes the new pdf.js files when an update brings them.

## Settings

- **Show PDFs in posts**: turn the View buttons on or off.
- **Open PDFs**: full screen, or in the post under the file. Phones always get full screen.
- **Permissions → View PDFs in posts**: which groups get the viewer. Everyone else keeps the normal link. Everyone has it after installing.

To get the card for new uploads, open FoF Upload's settings and choose **PDF viewer (Lectern)** as the template for `application/pdf`.

## Not in this version

Word, Excel and PowerPoint previews are possible later work.

## Links

- [GitHub](https://github.com/ernestdefoe/lectern)
- [Packagist](https://packagist.org/packages/ernestdefoe/lectern)

☕ If you like the things I have built, consider [buying me a coffee](https://buymeacoffee.com/ernestdefoe).

pdf.js is © Mozilla and contributors, Apache License 2.0 (see `assets/pdfjs-*/LICENSE`).
