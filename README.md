# Auteur

Auteur is a front-end JavaScript toolkit for adding augmentations to web-based D3 visualizations and visualization systems.
To use Auteur, please refer to the following installation instructions.

### Installation

To run the examples in this repository, first install all necessary package dependencies:

```
npm install
```

We use [storybook](https://www.npmjs.com/package/storybook) to organize our example gallery.
To run storybook, use:

```
npm run storybook
```

The page should automatically load at [http://localhost:6006/](http://localhost:6006/).

# Development

All code for our example gallery can be viewed in the `stories` folder, while the corresponding data files are all located under the `public` folder.

Code for an existing storybook example can be edited directly.
To create a new example, please ensure that the new file is located under the `stories` folder and has the extension `.stories.js`

All Auteur source code is located under the `src` folder.