# brindille-cli
A CLI tool to help you build Brindille apps.

![Snapshot](help.png)

## Install
```sh
npm install -g brindille-cli
```

## Use
From the root of your brindille project in the terminal:
```sh
# launches watchify and stylus in watch mode
brindille watch

# launches watchify and stylus in build mode
brindille build

# scaffolds a MyCompName component in /src/views/components/my-comp-name
brindille component MyCompName

# scaffolds a MyLayout component in /src/views/layouts/my-layout
brindille layout MyLayout

# scaffolds a MySection component in /src/views/sections/my-section
brindille section MySection
```

### Builders
The `watch` and `build` tasks are just wrappers around [stylus](http://stylus-lang.com/) and [browserify](http://browserify.org/) with our default configuration and a prettier console output.

You can optionnaly add browserify transforms to both `watch` and `build` tasks :
```sh
brindille watch babelify glslify
```


### Scaffolders
Wa have three different scaffolding functions which are in reality very similar: `component`, `layout` and `section`. The main difference between these is the folder where the component will be created (although a section will have a slightly different codebase than the others).

The name of the component must be in PascalCase.

You can chose to make the component extends [brindille-interactive-component](https://github.com/brindille/brindille-interactive-component) instead of [brindille-component](https://github.com/brindille/brindille-component):
```sh
brindille component MyCompName --interactive
```
