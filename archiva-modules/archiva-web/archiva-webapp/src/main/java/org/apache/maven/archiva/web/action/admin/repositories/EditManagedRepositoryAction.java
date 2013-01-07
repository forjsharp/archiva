package org.apache.maven.archiva.web.action.admin.repositories;

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import com.opensymphony.xwork2.Preparable;
import com.opensymphony.xwork2.Validateable;

import org.apache.commons.lang.StringUtils;
import org.apache.maven.archiva.configuration.Configuration;
import org.apache.maven.archiva.configuration.ManagedRepositoryConfiguration;
import org.apache.maven.archiva.database.ArchivaDAO;
import org.apache.maven.archiva.database.ArchivaDatabaseException;
import org.apache.maven.archiva.database.ObjectNotFoundException;
import org.apache.maven.archiva.database.RepositoryContentStatisticsDAO;
import org.apache.maven.archiva.database.constraints.RepositoryContentStatisticsByRepositoryConstraint;
import org.apache.maven.archiva.model.RepositoryContentStatistics;
import org.apache.maven.archiva.repository.audit.AuditEvent;
import org.codehaus.plexus.redback.role.RoleManagerException;
import org.codehaus.plexus.scheduler.CronExpressionValidator;

import java.io.File;
import java.io.IOException;
import java.util.List;

/**
 * AddManagedRepositoryAction 
 *
 * @version $Id$
 * 
 * @plexus.component role="com.opensymphony.xwork2.Action" role-hint="editManagedRepositoryAction" instantiation-strategy="per-lookup"
 */
public class EditManagedRepositoryAction
    extends AbstractManagedRepositoriesAction
    implements Preparable, Validateable
{
    /**
     * The model for this action.
     */
    private ManagedRepositoryConfiguration repository;

    private String repoid;
    
    private final String action = "editRepository";

    /**
     * @plexus.requirement role-hint="jdo"
     */
    private ArchivaDAO archivaDAO;

    public void prepare()
    {
        if ( StringUtils.isNotBlank( repoid ) )
        {
            repository = archivaConfiguration.getConfiguration().findManagedRepositoryById( repoid );
        }
        else if ( repository != null )
        {
            repository.setReleases( false );
            repository.setScanned( false );
        }
    }

    public String input()
    {
        if ( repository == null )
        {
            addActionError( "Edit failure, unable to edit a repository with a blank repository id." );
            return ERROR;
        }

        return INPUT;
    }

    public String confirmUpdate()
    {
    	// location was changed
        return save( true );
    }
    
    public String commit()
    {
        ManagedRepositoryConfiguration existingConfig =
            archivaConfiguration.getConfiguration().findManagedRepositoryById( repository.getId() );

        boolean resetStats = false;

        // check if the location was changed
        if( !StringUtils.equalsIgnoreCase( existingConfig.getLocation().trim(), repository.getLocation().trim() ) )
        {
            resetStats = true;

            File dir = new File( repository.getLocation() );
            if( dir.exists() )
            {
                return CONFIRM;
            }
        }
        
        return save( resetStats );
    }

    private String save( boolean resetStats )
    {
        // Ensure that the fields are valid.
        Configuration configuration = archivaConfiguration.getConfiguration();
        
        // We are in edit mode, remove the old repository configuration.
        removeRepository( repository.getId(), configuration );

        // Save the repository configuration.
        String result;
        try
        {
            addRepository( repository, configuration );
            triggerAuditEvent( repository.getId(), null, AuditEvent.MODIFY_MANAGED_REPO );
            addRepositoryRoles( repository );
            result = saveConfiguration( configuration );
            resetStatistics( resetStats );
        }
        catch ( IOException e )
        {
            addActionError( "I/O Exception: " + e.getMessage() );
            result = ERROR;
        }
        catch ( RoleManagerException e )
        {
            addActionError( "Role Manager Exception: " + e.getMessage() );
            result = ERROR;
        }
        catch ( ObjectNotFoundException e )
        {
            addActionError( e.getMessage() );
            result = ERROR;
        }
        catch ( ArchivaDatabaseException e )
        {
            addActionError( e.getMessage() );
            result = ERROR;
        }

        return result;
    }
    
    @Override
    public void validate()
    {
        CronExpressionValidator validator = new CronExpressionValidator();

        if ( !validator.validate( repository.getRefreshCronExpression() ) )
        {
            addFieldError( "repository.refreshCronExpression", "Invalid cron expression." );
        }

        trimAllRequestParameterValues();
    }

    private void resetStatistics( boolean reset )
        throws ObjectNotFoundException, ArchivaDatabaseException
    {
        if ( !reset )
        {
            return;
        }

        RepositoryContentStatisticsDAO repoContentStatsDao = archivaDAO.getRepositoryContentStatisticsDAO();

        List<RepositoryContentStatistics> contentStats = repoContentStatsDao.queryRepositoryContentStatistics(
                new RepositoryContentStatisticsByRepositoryConstraint( repository.getId() ) );

        if ( contentStats != null )
        {
            for ( RepositoryContentStatistics stats : contentStats )
            {
                repoContentStatsDao.deleteRepositoryContentStatistics( stats );
            }
        }
    }

    private void trimAllRequestParameterValues()
    {
        if(StringUtils.isNotEmpty(repository.getId()))
        {
            repository.setId(repository.getId().trim());
        }

        if(StringUtils.isNotEmpty(repository.getName()))
        {
            repository.setName(repository.getName().trim());
        }

        if(StringUtils.isNotEmpty(repository.getLocation()))
        {
            repository.setLocation(repository.getLocation().trim());
        }

        if(StringUtils.isNotEmpty(repository.getIndexDir()))
        {
            repository.setIndexDir(repository.getIndexDir().trim());
        }
    }

    public String getRepoid()
    {
        return repoid;
    }

    public void setRepoid( String repoid )
    {
        this.repoid = repoid;
    }

    public ManagedRepositoryConfiguration getRepository()
    {
        return repository;
    }

    public void setRepository( ManagedRepositoryConfiguration repository )
    {
        this.repository = repository;
    }
    
    public String getAction()
    {
        return action;
    }

    // for testing

    public void setArchivaDAO( ArchivaDAO archivaDao )
    {
        this.archivaDAO = archivaDao;
    }
}