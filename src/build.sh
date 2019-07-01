#!/bin/bash
DIST_FOLDER="../docs"
HTML_FILE_NAME="index.html"
JS_FILE_NAME="script.js"

rm $DIST_FOLDER/$HTML_FILE_NAME
rm $DIST_FOLDER/$JS_FILE_NAME
echo "arquivos apagados"

html-minifier --collapse-whitespace --remove-comments --minify-css true --minify-js true $HTML_FILE_NAME -o $DIST_FOLDER/$HTML_FILE_NAME
echo "$HTML_FILE_NAME minified"

uglifyjs --compress --mangle -o $DIST_FOLDER/$JS_FILE_NAME -- $JS_FILE_NAME
echo "$JS_FILE_NAME minified"
echo "Minification complete!"

# how to install
# sudo npm install -g html-minifier
# sudo npm install -g cssnano
# sudo npm install -g uglify-es


# rm -rf dist/
# mkdir dist
# mkdir dist/css
# echo "dist folder reset"
# HTML_FILE_NAME="<your file name>"
# CSS_FILE_NAME="<your file name>"
# JS_FILE_NAME="<your file name"
# html-minifier --collapse-whitespace $HTML_FILE_NAME -o dist/$HTML_FILE_NAME
# echo "$HTML_FILE_NAME minified"
# cssnano css/$CSS_FILE_NAME dist/css/$CSS_FILE_NAME
# echo "$CSS_FILE_NAME minified"
# uglifyjs --compress --mangle -o dist/$JS_FILE_NAME -- $JS_FILE_NAME
# echo "$JS_FILE_NAME minified"
# echo "Minification complete!"