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

$(document).ready(function(){

    //.itemSelected, .leftPanelMini, .leftPanelExpn, .mainLtMini, .mainLtExpn

    $("#tree-toggler").bind("click",
        function() {
            //$("body").hasClass("close-tree") ? $("body").removeClass("close-tree") : $("body").addClass("close-tree");
            if($("body").hasClass("close-tree") ){
                $("body").removeClass("close-tree");

                $("#left-panel").removeClass("leftPanelMini").addClass("leftPanelExpn");
                $("#main").removeClass("mainLtMini").addClass("mainLtExpn");

                
            } else{
                $("body").addClass("close-tree");

                $("#left-panel").removeClass("leftPanelExpn").addClass("leftPanelMini");
                $("#main").removeClass("mainLtExpn").addClass("mainLtMini");
                
            }
    });

    function loadProviderJSON(){
        $.ajax({
            url: '../allproviders/list',
            success: function(data) {
                addChildItems(data);                
            }
        });
    }
    function addChildItems(data){
        var children = $("#designTree").children();

        for(var i=0;i<children.length;i++){
            var id=$(children[i]).attr('data-ref');
            var _link = "ajax/DesignBlueprintNew.html?providerid=";

            if(data[id]){
                var temp=data[id];
                if(data[id].length > 0){
                    var $itemList=$('<ul class="sub-menu"></ul>');
                    $(temp).each(function(index,object){
                        $itemList.append($('<li id="'+object.providerName+'" class="providerAccount" data-id="'+object._id+'"><a href="#'+_link+object._id+'"><span class="title">'+object.providerName+'</span></a></li>'));
                    });
                    $(children[i]).append($itemList);
                }
            }
        }
        initTree($('#designTree'), data);
    };
    function initTree(treeParent, data){
        var lastSelected='';
        var childList=$(treeParent).children('li');
        var selectedProviderObj="";
        for(var i=0;i<childList.length;i++){
            $(childList[i]).attr('treeIndex','id_'+i).find('ul').find('li').each(function(index,value){
                $(this).attr('treeIndex','id_'+i+'_'+index);
            });
        };
        $(treeParent).children("li.providerType").on('click', function(e){
            if(lastSelected === $(this).attr('treeIndex')){            
                $(this).hasClass("open") ? $(this).removeClass("open") : $(this).addClass("open");                
                lastSelected=$(this).attr('treeIndex');
            }else{
                lastSelected=$(this).attr('treeIndex');
                $("#designTree").attr("lastSelected",lastSelected);
                $(treeParent).children("li.providerType").removeClass('open selectedProvider');
                $(this).addClass('open selectedProvider');
            }
        });
        $(treeParent).find('li.providerAccount').find('a').click(function(e){
            e.stopPropagation();
            $(treeParent).find('li.providerAccount').find('a').removeClass('itemSelected');
            $(this).addClass('itemSelected');

            var $parentLiElm = $(this).parent().parent().parent();
            var dataId = $(this).parent().attr('data-id');

            if(data[$parentLiElm.attr('data-ref')]){
                var iteminfo = data[$parentLiElm.attr('data-ref')];

                $(iteminfo).each(function(index,_d){
                    if(_d._id === dataId){
                        selectedProviderObj = _d;
                    }
                });
            }
            $(treeParent).children("li.providerType").removeClass('activ open');
            $parentLiElm.addClass('activ open');

        });
    }
    loadProviderJSON(); 
});
//function ends