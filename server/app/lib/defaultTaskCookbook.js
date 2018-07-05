/*
Copyright [2016] [Relevance Lab]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


var defaultCookbook = {

    "name": "unicorn-0.1.2",
    "attributes": [],
    "files": [],
    "json_class": "Chef::CookbookVersion",
    "providers": [],
    "metadata": {
        "dependencies": {
            "ruby": [],
            "rubygems": []
        },
        "name": "unicorn",
        "maintainer_email": "anshul@relevancelab.com",
        "attributes": {},
        "license": "Apache 2.0",
        "suggestions": {},
        "platforms": {},
        "maintainer": "Relevance Lab, Inc",
        "long_description": "= LICENSE AND AUTHOR:\n\nAuthor:: Relevance Lab...",
        "recommendations": {},
        "version": "0.0.1",
        "conflicting": {},
        "groupings": {},
        "replacing": {},
        "description": "Cookbook for extracting attributes",
        "providing": {}
    },
    "libraries": [],
    "resources": [],
    "cookbook_name": "unicorn",
    "version": "0.0.1",
    "recipes": [{
        "name": "default.rb",
        "checksum": "ba0dadcbca26710a521e0e3160cc5e20",
        "path": "recipes/default.rb",
        "specificity": "default"
    }],
    "root_files": [{
        "name": "README.rdoc",
        "checksum": "d18c630c8a68ffa4852d13214d0525a6",
        "path": "README.rdoc",
        "specificity": "default"
    }, {
        "name": "metadata.rb",
        "checksum": "967087a09f48f234028d3aa27a094882",
        "path": "metadata.rb",
        "specificity": "default"
    }, {
        "name": "metadata.json",
        "checksum": "45b27c78955f6a738d2d42d88056c57c",
        "path": "metadata.json",
        "specificity": "default"
    }],
    "chef_type": "cookbook_version"
};

module.exports = function(cookbookName) {
    defaultCookbook.name = cookbookName;
    defaultCookbook.metadata.name = cookbookName;
    defaultCookbook.cookbook_name = cookbookName;
    return defaultCookbook;
}