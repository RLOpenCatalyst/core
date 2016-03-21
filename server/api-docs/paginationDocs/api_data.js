define({ "api": [
  {
    "type": "post",
    "url": "/providers/:providerId/unmanagedInstances",
    "title": "",
    "name": "_providers__providerId_unmanagedInstances",
    "group": "UnmanagedInstance_List_with_Pagination_Sorting_Filtering",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "providerId",
            "description": "<p>Unique providerID.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "page",
            "description": "<p>Current Page default is 1.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "optional": true,
            "field": "pageSize",
            "description": "<p>Records per page default is 10.</p>"
          },
          {
            "group": "Parameter",
            "type": "JSONObject",
            "optional": true,
            "field": "sortBy",
            "description": "<p>Records Sort By default is State and Sort Type is Desending.</p>"
          },
          {
            "group": "Parameter",
            "type": "JSONArray",
            "optional": true,
            "field": "filterBy",
            "description": "<p>Records Filter By default are State and OS Type.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": true,
            "field": "searchBy",
            "description": "<p>Records Search By Instance ID or IP Address.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "optional": true,
            "field": "JSONObject",
            "description": ""
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": " HTTP/1.1 200 OK\n{\n paginationData: [{\"_id\":\"56e7a198789daf6c3863b25c\",\"orgId\":\"46d1da9a-d927-41dc-8e9e-7e926d927537\",\"providerId\":\"56e2a90dccdaec5111a74e2f\",\"providerType\":\"aws\",\"providerData\":{\"region\":\"ap-southeast-1\"},\"platformId\":\"i-1d97d593\",\"ip\":\"52.77.240.203\",\"os\":\"linux\",\"state\":\"running\",\"__v\":0},\n {\"_id\":\"56e7a199789daf6c3863b263\",\"orgId\":\"46d1da9a-d927-41dc-8e9e-7e926d927537\",\"providerId\":\"56e2a90dccdaec5111a74e2f\",\"providerType\":\"aws\",\"providerData\":{\"region\":\"us-east-1\"},\"platformId\":\"i-9d0f3118\",\"ip\":\"54.88.125.156\",\"os\":\"linux\",\"state\":\"running\",\"__v\":0,\"tags\":{\"Name\":\"SensuServer\"}},\n {\"_id\":\"56e7a19a789daf6c3863b26d\",\"orgId\":\"46d1da9a-d927-41dc-8e9e-7e926d927537\",\"providerId\":\"56e2a90dccdaec5111a74e2f\",\"providerType\":\"aws\",\"providerData\":{\"region\":\"us-west-1\"},\"platformId\":\"i-e75fb552\",\"ip\":\"10.0.0.106\",\"os\":\"linux\",\"state\":\"running\",\"__v\":0,\"tags\":{\"Name\":\"shreeram\"}},\n {\"_id\":\"56e7a19a789daf6c3863b26e\",\"orgId\":\"46d1da9a-d927-41dc-8e9e-7e926d927537\",\"providerId\":\"56e2a90dccdaec5111a74e2f\",\"providerType\":\"aws\",\"providerData\":{\"region\":\"us-west-1\"},\"platformId\":\"i-7bc992b9\",\"ip\":\"54.67.35.103\",\"os\":\"linux\",\"state\":\"running\",\"__v\":0,\"tags\":{\"Name\":\"NginX_Instance\",\"Owner\":\"Hamid\",\"Environment\":\"Production\",\"Role\":\"WebGateway\",\"Bill\":\"Catalyst\"}},\n {\"_id\":\"56e7a19a789daf6c3863b273\",\"orgId\":\"46d1da9a-d927-41dc-8e9e-7e926d927537\",\"providerId\":\"56e2a90dccdaec5111a74e2f\",\"providerType\":\"aws\",\"providerData\":{\"region\":\"us-west-1\"},\"platformId\":\"i-d3411313\",\"ip\":\"10.0.1.92\",\"os\":\"linux\",\"state\":\"running\",\"__v\":0,\"tags\":{\"Name\":\"MonitoringServer\",\"Environment\":\"Production\",\"Owner\":\"Hamid\",\"Bill\":\"Catalyst\"}\n }],\n totalRecords:48,\n pageSize:5,\n page:1,\n totalPages:10,\n sortBy:{state:-1},\n filterBy:[{os:'linux'},{state:'running'}]\n }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 4xx": [
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "ProviderNotFound",
            "description": "<p>The ProviderID of the Active Organization was not found.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "DataNotFound",
            "description": "<p>Data is not present for respective search parameter.</p>"
          },
          {
            "group": "Error 4xx",
            "optional": false,
            "field": "ServerProblem",
            "description": "<p>Server Behaved Unexpectedly.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"error\": \"provider not found\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"error\": \"data not found\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 505\n{\n  \"error\": \"Server Behaved Unexpectedly\"\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./pagination.js",
    "groupTitle": "UnmanagedInstance_List_with_Pagination_Sorting_Filtering"
  }
] });
