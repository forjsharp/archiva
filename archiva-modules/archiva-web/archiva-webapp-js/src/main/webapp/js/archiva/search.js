/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
$(function() {

  //-----------------------------------------
  // browse part
  //-----------------------------------------

  BrowseViewModel=function(browseResultEntries,parentBrowseViewModel,groupId){
    var self=this;
    this.browseResultEntries=browseResultEntries;
    this.parentBrowseViewModel=parentBrowseViewModel;
    this.groupId=groupId;
    displayGroupId=function(groupId){
      displayGroupDetail(groupId,self);
    }
    displayParentGroupId=function(){
      $.log("called displayParentGroupId groupId:"+self.parentBrowseViewModel.groupId);
      // if null parent is root level
      if (self.parentBrowseViewModel.groupId){
        displayGroupDetail(self.parentBrowseViewModel.groupId,self.parentBrowseViewModel);
      } else {
        browseRoot();
      }
    }

    displayProjectEntry=function(id){
      // value org.apache.maven/maven-archiver
      // split this org.apache.maven and maven-archiver
      var values = id.split(".");
      var groupId="";
      for (var i = 0;i<values.length-1;i++){
        groupId+=values[i];
        if (i<values.length-2)groupId+=".";
      }
      var artifactId=values[values.length-1];
      displayArtifactDetail(groupId,artifactId,self);

    }

    breadCrumbEntries=function(){
      // root level ?
      if (!self.parentBrowseViewModel) return [];
      return calculateBreadCrumbEntries(self.groupId);
    }

    displayEntry=function(value){
      if (self.groupId){
        return value.substr(self.groupId.length+1,value.length-self.groupId.length);
      }
      return value;
    }
  }

  calculateBreadCrumbEntries=function(groupId){
    var splitted = groupId.split(".");
    var breadCrumbEntries=[];
    var curGroupId="";
    for (var i=0;i<splitted.length;i++){
      curGroupId+=splitted[i];
      breadCrumbEntries.push(new BreadCrumbEntry(curGroupId,splitted[i]));
      curGroupId+="."
    }
    return breadCrumbEntries;
  }

  displayGroupDetail=function(groupId,parentBrowseViewModel,restUrl){
    var mainContent = $("#main-content");
    var browseResult=mainContent.find("#browse_result");
    browseResult.show();
    mainContent.find("#browse_artifact" ).hide();
    var browseBreadCrumb=mainContent.find("#browse_breadcrumb");
    mainContent.find("#main_browse_result_content").hide( "slide", {}, 300,
        function(){
          browseResult.html(mediumSpinnerImg());
          browseBreadCrumb.html(smallSpinnerImg());
          mainContent.find("#main_browse_result_content" ).show();
          var url = restUrl ? restUrl : "restServices/archivaServices/browseService/browseGroupId/"+encodeURIComponent(groupId);
          $.ajax(url, {
            type: "GET",
            dataType: 'json',
            success: function(data) {
              var browseResultEntries = mapbrowseResultEntries(data);
              var browseViewModel = new BrowseViewModel(browseResultEntries,parentBrowseViewModel,groupId);
              ko.applyBindings(browseViewModel,browseBreadCrumb.get(0));
              ko.applyBindings(browseViewModel,browseResult.get(0));
            }
         });
        }
    );
  }

  ArtifactDetailViewModel=function(groupId,artifactId){
    var self=this;
    this.versions=[];
    this.projectVersionMetadata=null;
    this.groupId=groupId;
    this.artifactId=artifactId;
    breadCrumbEntries=function(){
      var entries = calculateBreadCrumbEntries(self.groupId);
      entries.push(new BreadCrumbEntry("foo",self.artifactId));
      return entries;
    }
    displayArtifactInfo=function(){
      if ($("#main-content #artifact-info:visible" ).length>0) {
        $("#main-content #artifact-info" ).hide();
      } else {
        $("#main-content #artifact-info" ).show();
      }


    }
  }

  displayArtifactDetail=function(groupId,artifactId,parentBrowseViewModel,restUrl){
    var artifactDetailViewModel=new ArtifactDetailViewModel(groupId,artifactId);
    var mainContent = $("#main-content");
    mainContent.find("#browse_result").hide();
    mainContent.find("#main_browse_result_content").hide("slide", {}, 300,function(){
      mainContent.find("#browse_breadcrumb").html(smallSpinnerImg());
      mainContent.find("#browse_artifact").show();
      mainContent.find("#browse_artifact").html(mediumSpinnerImg());
      mainContent.find("#main_browse_result_content").show();
      $.ajax("restServices/archivaServices/browseService/projectVersionMetadata/"+encodeURIComponent(groupId)+"/"+encodeURIComponent(artifactId), {
        type: "GET",
        dataType: 'json',
        success: function(data) {
          artifactDetailViewModel.projectVersionMetadata=mapProjectVersionMetadata(data);
          $.ajax("restServices/archivaServices/browseService/versionsList/"+encodeURIComponent(groupId)+"/"+encodeURIComponent(artifactId), {
            type: "GET",
            dataType: 'json',
            success: function(data) {
              artifactDetailViewModel.versions=mapVersionsList(data);
              ko.applyBindings(artifactDetailViewModel,mainContent.find("#browse_artifact").get(0));
              ko.applyBindings(artifactDetailViewModel,mainContent.find("#browse_breadcrumb").get(0));

             }
          });
        }
      });
    });
  }

  browseRoot=function(){
    displayGroupDetail(null,null,"restServices/archivaServices/browseService/rootGroups");
  }

  /**
   * call from menu entry to display root level
   */
  displayBrowse=function(){
    screenChange()
    var mainContent = $("#main-content");
    mainContent.html($("#browse-tmpl" ).tmpl());
    mainContent.find("#browse_result").html(mediumSpinnerImg());
    $.ajax("restServices/archivaServices/browseService/rootGroups", {
        type: "GET",
        dataType: 'json',
        success: function(data) {
          var browseResultEntries = mapbrowseResultEntries(data);
          $.log("size:"+browseResultEntries.length);
          var browseViewModel = new BrowseViewModel(browseResultEntries,null,null);
          ko.applyBindings(browseViewModel,mainContent.find("#browse_breadcrumb").get(0));
          ko.applyBindings(browseViewModel,mainContent.find("#browse_result").get(0));
        }
    });
    enableAutocompleBrowse();
  }

  enableAutocompleBrowse=function(){
    // browse-autocomplete
    $( "#main-content #browse-autocomplete" ).autocomplete({
      minLength: 3,
			source: function(request, response){
        var query = "";
        if (request.term.indexOf('.')<0){
          // try with rootGroups then filtered
          $.get("restServices/archivaServices/browseService/rootGroups",
             function(data) {
               var browseResultEntries = mapbrowseResultEntries(data);
               var filetered = [];
               for(var i=0;i<browseResultEntries.length;i++){
                 if (browseResultEntries[i].name.startsWith(request.term)){
                   filetered.push(browseResultEntries[i]);
                 }
               }
               response(filetered);

             }
          );
          return;
        }
        var dotEnd=request.term.endsWith(".");
        // org.apache. requets with org.apache
        // org.apa request with org before last dot and filter response with startsWith
        if (request.term.indexOf(".")>=0){
          if (dotEnd){
            query= request.term.substring(0, request.term.length-1);
          } else {
            // substring before last
            query=request.term.substringBeforeLast(".");
          }
        } else {
          query=request.term;
        }
        $.get("restServices/archivaServices/browseService/browseGroupId/"+encodeURIComponent(query),
           function(data) {
             var browseResultEntries = mapbrowseResultEntries(data);
             if (dotEnd){
              response(browseResultEntries);
             } else {
               var filetered = [];
               for(var i=0;i<browseResultEntries.length;i++){
                 if (browseResultEntries[i].name.startsWith(request.term)){
                   filetered.push(browseResultEntries[i]);
                 }
               }
               response(filetered);
             }
           }
        );
      },
      select: function( event, ui ) {
        $.log("ui.item.label:"+ui.item.name);
        if (ui.item.project){
          // value org.apache.maven/maven-archiver
          // split this org.apache.maven and maven-archiver
          var id=ui.item.name;
          var values = id.split(".");
          var groupId="";
          for (var i = 0;i<values.length-1;i++){
            groupId+=values[i];
            if (i<values.length-2)groupId+=".";
          }
          var artifactId=values[values.length-1];
          displayArtifactDetail(groupId,artifactId,self);
        } else {
          displayBrowseGroupIdFromAutoComplete(ui.item.name);
        }
        return false;
      }
		}).data( "autocomplete" )._renderItem = function( ul, item ) {
					return $( "<li></li>" )
						.data( "item.autocomplete", item )
						.append( "<a>" + item.name + "</a>" )
						.appendTo( ul );
				};;
  }

  /**
   * called if browser url contains queryParam browse=groupId
   * @param groupId
   */
  displayBrowseGroupIdFromAutoComplete=function(groupId){
    clearUserMessages();
    var mainContent = $("#main-content");
    //mainContent.html($("#browse-tmpl" ).tmpl());
    mainContent.find("#browse_result").html(mediumSpinnerImg());
    var parentBrowseViewModel=new BrowseViewModel(null,null,null);
    displayGroupDetail(groupId,parentBrowseViewModel,null);
    enableAutocompleBrowse();
  }

  /**
   * called if browser url contains queryParam browse=groupId
   * @param groupId
   */
  displayBrowseGroupId=function(groupId){
    clearUserMessages();
    var mainContent = $("#main-content");
    mainContent.html($("#browse-tmpl" ).tmpl());
    mainContent.find("#browse_result").html(mediumSpinnerImg());
    var parentBrowseViewModel=new BrowseViewModel(null,null,null);
    displayGroupDetail(groupId,parentBrowseViewModel,null);
    enableAutocompleBrowse();
  }


  mapbrowseResultEntries=function(data){
    $.log("mapbrowseResultEntries");
    if (data.browseResultEntries) {
      return $.isArray(data.browseResultEntries) ?
         $.map(data.browseResultEntries,function(item){
           return new BrowseResultEntry(item.name, item.project);
         } ).sort(): [data.browseResultEntries];
    }
    return [];
  }

  BrowseResultEntry=function(name,project){
    this.name=name;
    this.project=project;
  }

  BreadCrumbEntry=function(groupId,displayValue){
    this.groupId=groupId;
    this.displayValue=displayValue;
    this.artifactId=null;
    this.artifact=false;
  }
  mapVersionsList=function(data){
    if (data){
      if (data.versions){
        return $.isArray(data.versions)? $.map(data.versions,function(item){return item})
            :[data.versions];
      }

    }
    return [];
  }
  mapProjectVersionMetadata=function(data){
    if (data){
      var projectVersionMetadata =
          new ProjectVersionMetadata(data.id,data.url,
                                    data.name,data.description,
                                    null,null,null,null,null,null,null,data.incomplete);

      if (data.organization){
        projectVersionMetadata.organization=new Organization(data.organization.name,data.organization.url);
      }
      if (data.issueManagement){
        projectVersionMetadata.issueManagement=
            new IssueManagement(data.issueManagement.system,data.issueManagement.url);
      }
      if (data.scm){
        projectVersionMetadata.scm=
            new Scm(data.scm.connection,data.scm.developerConnection,data.scm.url);
      }
      if (data.ciManagement){
        projectVersionMetadata.ciManagement=new CiManagement(data.ciManagement.system,data.ciManagement.url);
      }
      if (data.licenses){
        var licenses =
        $.isArray(data.licenses) ? $.map(data.licenses,function(item){
              return new License(item.name,item.url);
          }):[data.licenses];
        projectVersionMetadata.licenses=licenses;
      }
      if (data.mailingLists){
        var mailingLists =
        $.isArray(data.mailingLists) ? $.map(data.mailingLists,function(item){
              return new MailingList(item.mainArchiveUrl,item.otherArchives,item.name,item.postAddress,
                                     item.subscribeAddress,item.unsubscribeAddress);
          }):[data.mailingLists];
        projectVersionMetadata.mailingLists=mailingLists;
      }
      if (data.dependencies){
        var dependencies =
        $.isArray(data.dependencies) ? $.map(data.dependencies,function(item){
              return new Dependency(item.classifier,item.optional,item.scope,item.systemPath,item.type,
                                    item.artifactId,item.groupId,item.version);
          }):[data.dependencies];
        projectVersionMetadata.dependencies=dependencies;
      }
      $.log("projectVersionMetadata.issueManagement.system:"+(projectVersionMetadata.issueManagement?projectVersionMetadata.issueManagement.system:"null"));
      return projectVersionMetadata;
    }
    return null;
  }

  ProjectVersionMetadata=function(id,url,name,description,organization,issueManagement,scm,ciManagement,licenses,
                                  mailingLists,dependencies,incomplete){
    // private String id;
    this.id=id;

    // private String url;
    this.url=url

    //private String name;
    this.name=name;

    //private String description;
    this.description=description;

    //private Organization organization;
    this.organization=organization;

    //private IssueManagement issueManagement;
    this.issueManagement=issueManagement;

    //private Scm scm;
    this.scm=scm;

    //private CiManagement ciManagement;
    this.ciManagement=ciManagement;

    //private List<License> licenses = new ArrayList<License>();
    this.licenses=licenses;

    //private List<MailingList> mailingLists = new ArrayList<MailingList>();
    this.mailingLists=mailingLists;

    //private List<Dependency> dependencies = new ArrayList<Dependency>();
    this.dependencies=dependencies;

    //private boolean incomplete;
    this.incomplete=incomplete;

  }

  Organization=function(name,url){
    //private String name;
    this.name=name;

    //private String url;
    this.url=url;
  }

  IssueManagement=function(system,url) {
    //private String system;
    this.system=system;

    //private String url;
    this.url=url;
  }

  Scm=function(connection,developerConnection,url) {
    //private String connection;
    this.connection=connection;

    //private String developerConnection;
    this.developerConnection=developerConnection;

    //private String url;
    this.url=url;
  }

  CiManagement=function(system,url) {
    //private String system;
    this.system=system;

    //private String url;
    this.url=url;
  }

  License=function(name,url){
    this.name=name;
    this.url=url;
  }

  MailingList=function(mainArchiveUrl,otherArchives,name,postAddress,subscribeAddress,unsubscribeAddress){
    //private String mainArchiveUrl;
    this.mainArchiveUrl=mainArchiveUrl;

    //private List<String> otherArchives;
    this.otherArchives=otherArchives;

    //private String name;
    this.name=name;

    //private String postAddress;
    this.postAddress=postAddress;

    //private String subscribeAddress;
    this.subscribeAddress=subscribeAddress;

    //private String unsubscribeAddress;
    this.unsubscribeAddress=unsubscribeAddress;
  }

  Dependency=function(classifier,optional,scope,systemPath,type,artifactId,groupId,version){
    //private String classifier;
    this.classifier=classifier;

    //private boolean optional;
    this.optional=optional;

    //private String scope;
    this.scope=scope;

    //private String systemPath;
    this.systemPath=systemPath;

    //private String type;
    this.type=type;

    //private String artifactId;
    this.artifactId=artifactId;

    //private String groupId;
    this.groupId=groupId;

    //private String version;
    this.version=version;

  }

  //-----------------------------------------
  // search part
  //-----------------------------------------
  Artifact=function(context,url,groupId,artifactId,repositoryId,version,prefix,goals,bundleVersion,bundleSymbolicName,
                    bundleExportPackage,bundleExportService,bundleDescription,bundleName,bundleLicense,bundleDocUrl,
                    bundleImportPackage,bundleRequireBundle,classifier,packaging,fileExtension){
    //private String context;
    this.context=context;

    //private String url;
    this.url=url;

    //private String groupId;
    this.groupId=groupId;

    //private String artifactId;
    this.artifactId=artifactId;

    //private String repositoryId;
    this.repositoryId=repositoryId;

    //private String version;
    this.version=version;

    //Plugin goal prefix (only if packaging is "maven-plugin")
    //private String prefix;
    this.prefix=prefix;

    //Plugin goals (only if packaging is "maven-plugin")
    //private List<String> goals;
    this.goals=goals;

    //private String bundleVersion;
    this.bundleVersion=bundleVersion;

    // contains osgi metadata Bundle-SymbolicName if available
    //private String bundleSymbolicName;
    this.bundleSymbolicName=bundleSymbolicName;

    //contains osgi metadata Export-Package if available
    //private String bundleExportPackage;
    this.bundleExportPackage=bundleExportPackage;

    //contains osgi metadata Export-Service if available
    //private String bundleExportService;
    this.bundleExportService=bundleExportService;

    ///contains osgi metadata Bundle-Description if available
    //private String bundleDescription;
    this.bundleDescription=bundleDescription;

    // contains osgi metadata Bundle-Name if available
    //private String bundleName;
    this.bundleName=bundleName;

    //contains osgi metadata Bundle-License if available
    //private String bundleLicense;
    this.bundleLicense=bundleLicense;

    ///contains osgi metadata Bundle-DocURL if available
    //private String bundleDocUrl;
    this.bundleDocUrl=bundleDocUrl;

    // contains osgi metadata Import-Package if available
    //private String bundleImportPackage;
    this.bundleImportPackage=bundleImportPackage;

    ///contains osgi metadata Require-Bundle if available
    //private String bundleRequireBundle;
    this.bundleRequireBundle=bundleRequireBundle;

    //private String classifier;
    this.classifier=classifier;

    //private String packaging;
    this.packaging=packaging;

    //file extension of the artifact
    //private String fileExtension;
    this.fileExtension=fileExtension;
  }

  mapArtifacts=function(data){
    if (data){
      return $.isArray(data )? $.map(data,function(item){return mapArtifact(item)}) : [data];
    }
    return [];
  }

  mapArtifact=function(data){
    return new Artifact(data.context,data.url,data.groupId,data.artifactId,data.repositoryId,data.version,data.prefix,
                        data.goals,data.bundleVersion,data.bundleSymbolicName,
                        data.bundleExportPackage,data.bundleExportService,data.bundleDescription,data.bundleName,
                        data.bundleLicense,data.bundleDocUrl,
                        data.bundleImportPackage,data.bundleRequireBundle,data.classifier,data.packaging,data.fileExtension);
  }

  SearchRequest=function(){

    this.queryTerms=ko.observable();

    //private String groupId;
    this.groupId=ko.observable();

    //private String artifactId;
    this.artifactId=ko.observable();

    //private String version;
    this.version=ko.observable();

    //private String packaging;
    this.packaging=ko.observable();

    //private String className;
    this.className=ko.observable();

    //private List<String> repositories = new ArrayList<String>();
    this.repositories=ko.observableArray([]);

    //private String bundleVersion;
    this.bundleVersion=ko.observable();

    //private String bundleSymbolicName;
    this.bundleSymbolicName=ko.observable();

    //private String bundleExportPackage;
    this.bundleExportPackage=ko.observable();

    //private String bundleExportService;
    this.bundleExportService=ko.observable();

    //private String classifier;
    this.classifier=ko.observable();

    //private boolean includePomArtifacts = false;
    this.includePomArtifacts=ko.observable(false);
  }

  applyAutocompleteOnHeader=function(property,resultViewModel){
    $( "#main-content #search-filter-auto-"+property ).autocomplete({
      minLength: 0,
			source: function(request, response){
        var founds=[];
        $(resultViewModel.artifacts()).each(function(idx,artifact){
          if(artifact[property].startsWith(request.term)){
            founds.push(artifact[property]);
          }
        });
        response(unifyArray(founds,true));
      },
      select: function( event, ui ) {
        $.log("property:"+property+','+ui.item.value);
        var artifacts=[];
        $(resultViewModel.artifacts()).each(function(idx,artifact){
          if(artifact[property].startsWith(ui.item.value)){
            artifacts.push(artifact);
          }
        });
        resultViewModel.artifacts(artifacts);
        return false;
      }
    });
  }

  ResultViewModel=function(artifacts){
    var self=this;
    this.originalArtifacts=artifacts;
    this.artifacts=ko.observableArray(artifacts);
    this.gridViewModel = new ko.simpleGrid.viewModel({
      data: self.artifacts,
      columns: [
        {
          headerText: $.i18n.prop('search.artifact.results.groupId'),
          rowText: "groupId",
          id: "groupId"
        },
        {
          headerText: $.i18n.prop('search.artifact.results.artifactId'),
          rowText: "artifactId",
          id: "artifactId"
        },
        {
          headerText: $.i18n.prop('search.artifact.results.version'),
          rowText: "version",
          id: "version"
        }
      ],
      pageSize: 10,
      gridUpdateCallBack: function(){
        applyAutocompleteOnHeader('groupId',self);
        applyAutocompleteOnHeader('artifactId',self);
        applyAutocompleteOnHeader('version',self);
      }
    });
  }


  SearchViewModel=function(){
    var self=this;
    this.searchRequest=ko.observable(new SearchRequest());
    this.observableRepoIds=ko.observableArray([]);
    this.selectedRepoIds=[];
    this.resultViewModel=new ResultViewModel([]);
    basicSearch=function(){
      var queryTerm=this.searchRequest().queryTerms();
      if ($.trim(queryTerm).length<1){
        var errorList=[{
          message: $.i18n.prop("search.artifact.search.form.terms.empty"),
    		  element: $("#main-content #search-basic-form #search-terms" ).get(0)
        }];
        customShowError("#main-content #search-basic-form", null, null, errorList);
        return;
      } else {
        // cleanup previours error message
        customShowError("#main-content #search-basic-form", null, null, []);
      }
      self.search("restServices/archivaServices/searchService/quickSearchWithRepositories");


    }

    advancedSearch=function(){
      self.search("restServices/archivaServices/searchService/searchArtifacts");
    }
    removeFilter=function(){
      self.resultViewModel.artifacts(self.resultViewModel.originalArtifacts);
    }
    this.search=function(url){

      var mainContent=$("#main-content");

      var searchResultsGrid=mainContent.find("#search-results #search-results-grid" );
      mainContent.find("#btn-basic-search" ).button("loading");
      mainContent.find("#btn-advanced-search" ).button("loading");
      $("#user-messages").html(mediumSpinnerImg());


      self.selectedRepoIds=[];
      mainContent.find("#search-basic-repositories" )
          .find(".chzn-choices li span").each(function(i,span){
                      self.selectedRepoIds.push($(span).html());
                      }
                    );

      this.searchRequest().repositories=this.selectedRepoIds;
      $.ajax(url,
        {
          type: "POST",
          data: ko.toJSON(this.searchRequest),
          contentType: 'application/json',
          dataType: 'json',
          success: function(data) {
            clearUserMessages();
            var artifacts=mapArtifacts(data);
            if (artifacts.length<1){
              displayWarningMessage( $.i18n.prop("search.artifact.noresults"));
              return;
            } else {
              self.resultViewModel.originalArtifacts=artifacts;
              self.resultViewModel.artifacts(artifacts);
              if (!searchResultsGrid.attr("data-bind")){
                searchResultsGrid.attr("data-bind",
                                 "simpleGrid: gridViewModel,simpleGridTemplate:'search-results-view-grid-tmpl',pageLinksId:'search-results-view-grid-pagination'");
                ko.applyBindings(self.resultViewModel,searchResultsGrid.get(0));
                ko.applyBindings(self,mainContent.find("#remove-filter-id" ).get(0));
              }

              activateSearchResultsTab();
            }
          },
          error: function(data) {
            var res = $.parseJSON(data.responseText);
            displayRestError(res);
          },
          complete:function() {
            mainContent.find("##btn-basic-search" ).button("reset");
            mainContent.find("#btn-advanced-search" ).button("reset");
            removeMediumSpinnerImg("#user-messages");
          }
        }
      );
    }

  }

  activateSearchResultsTab=function(){
    var mainContent=$("#main-content");
    mainContent.find("#search-form-collapse").removeClass("active");
    mainContent.find("#search-results").addClass("active");

    mainContent.find("#search-form-collapse-li").removeClass("active");
    mainContent.find("#search-results-li" ).addClass("active");

  }

  displaySearch=function(){
    clearUserMessages();
    var mainContent=$("#main-content");
    mainContent.html(mediumSpinnerImg());
    $.ajax("restServices/archivaServices/searchService/observableRepoIds", {
        type: "GET",
        dataType: 'json',
        success: function(data) {
          mainContent.html($("#search-artifacts-div-tmpl" ).tmpl());
          var searchViewModel=new SearchViewModel();
          var repos=mapStringList(data);
          $.log("repos:"+repos);
          searchViewModel.observableRepoIds(repos);
          ko.applyBindings(searchViewModel,mainContent.find("#search-artifacts-div").get(0));
          mainContent.find("#search-basic-repostories-select" ).chosen();
        }
    });

  }

});