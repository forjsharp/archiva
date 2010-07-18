<%--
  ~ Licensed to the Apache Software Foundation (ASF) under one
  ~ or more contributor license agreements.  See the NOTICE file
  ~ distributed with this work for additional information
  ~ regarding copyright ownership.  The ASF licenses this file
  ~ to you under the Apache License, Version 2.0 (the
  ~ "License"); you may not use this file except in compliance
  ~ with the License.  You may obtain a copy of the License at
  ~
  ~   http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
  --%>

<%@ page contentType="text/html; charset=UTF-8" %>
<%@ taglib prefix="s" uri="/struts-tags" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<html>
<head>
  <title>Admin: Add Managed Repository</title>
  <s:head/>
</head>

<body>

<h1>Admin: Add Managed Repository</h1>

  <div class="warningbox">
    <p>
      <strong>WARNING: There Are some conflicts Artifacts.</strong>
    </p>
  </div>

  <p>
    Are you sure you want to  merge the Repository
    <%--<c:choose>--%>
      <%--<c:when test="${action == 'merge'}">add</c:when>--%>
      <%--<c:otherwise>update</c:otherwise>--%>
    <%--</c:choose>--%>

  </p>

  <div class="infobox">
    <table class="infotable">
      <tr>
        <td>ID:</td>
        <td><code>${repository.id}</code></td>
      </tr>
      <tr>
        <td>Name:</td>
        <td>${repository.name}</td>
      </tr>
      <tr>
        <td>Directory:</td>
        <td>${repository.location}</td>
      </tr>
      <tr>
        <td>Index Directory:</td>
        <td>${repository.indexDir}</td>
      </tr>
      <tr>
        <td>Type:</td>
        <%--td>${repository.layout}</td--%>
        <td>
          <c:choose>
	        <c:when test="${repository.layout == 'default'}">
	          Maven 2.x Repository
	        </c:when>
	        <c:otherwise>
	          Maven 1.x Repository
	        </c:otherwise>
	      </c:choose>
	    </td>
      </tr>
      <tr>
        <td>Cron:</td>
        <td>${repository.refreshCronExpression}</td>
      </tr>
      <tr>
        <td>Repository Purge By Days Older Than:</td>
        <td>${repository.daysOlder}</td>
      </tr>
      <tr>
        <td>Repository Purge By Retention Count:</td>
        <td>${repository.retentionCount}</td>
      </tr>
      <tr>
        <td>Releases Included:</td>
        <td class="${repository.releases ? 'donemark' : 'errormark'} booleanIcon">
      </tr>
      <tr>
        <td>Snapshots Included:</td>
        <td class="${repository.snapshots ? 'donemark' : 'errormark'} booleanIcon">
      </tr>
      <tr>
        <td>Scannable:</td>
        <td class="${repository.scanned ? 'donemark' : 'errormark'} booleanIcon">
      </tr>
      <tr>
        <td>Delete Released Snapshots:</td>
        <td class="${repository.deleteReleasedSnapshots ? 'donemark' : 'errormark'} booleanIcon">
      </tr>
    </table>
  </div>

  <s:form method="post" action="%{action}" namespace="/admin" validate="true" theme="simple">
    <div class="buttons">
      <s:hidden name="repository.id" value="%{#attr.repository.id}"/>
      <s:hidden name="repository.name" value="%{#attr.repository.name}"/>
      <s:hidden name="repository.location" value="%{#attr.repository.location}"/>
      <s:hidden name="repository.indexDir" value="%{#attr.repository.indexDir}"/>
      <s:hidden name="repository.layout" value="%{#attr.repository.layout}"/>
      <s:hidden name="repository.refreshCronExpression" value="%{#attr.repository.refreshCronExpression}"/>
      <s:hidden name="repository.daysOlder" value="%{#attr.repository.daysOlder}"/>
      <s:hidden name="repository.retentionCount" value="%{#attr.repository.retentionCount}"/>
      <s:hidden name="repository.releases" value="%{#attr.repository.releases}"/>
      <s:hidden name="repository.snapshots" value="%{#attr.repository.snapshots}"/>
      <s:hidden name="repository.scanned" value="%{#attr.repository.scanned}"/>
      <s:hidden name="repository.deleteReleasedSnapshots" value="%{#attr.repository.deleteReleasedSnapshots}"/>

      <%--<c:choose>--%>

        <s:submit value="Save" method="merge"/>
        <%--<c:when test="${action == 'addRepository'}">--%>
      	  <%--<s:submit value="Save" method="confirmAdd"/>--%>
      	<%--</c:when>--%>
      	<%--<c:otherwise>--%>
      	  <%--<s:submit value="Save" method="confirmUpdate"/>--%>
      	<%--</c:otherwise>--%>
     <%--</c:choose>--%>

      <s:submit value="Cancel" method="execute"/>
    </div>
  </s:form>

</body>
</html>
