# RLCatalyst - Create User (Task)
## User Management

### Purpose 
				Create new user in RLCatalyst.

#### How it Work 

- Usage
	- User can edit parameters and save it as a New BOT.
	- User can edit parameters and update Existing BOT.
	- In both case after save either new data file will be committed in Git or existing code will be updated based on choice.
  
- Parameters

Name    |    Description           |      Values        
---------------|--------------------------|--------------------
Username   | Catalyst username.                |    admin
Password   | Catalyst user password.                |    admin
User   | new user name.                |    john 
Email   | new user email.                |    john@rl.com 
RLCatalyst Server   | RLCatalyst server link or IP.                |    https://neocatalyst.rlcatalyst.com


- Result
	- After bot execution successfully new user will be created in RLCatalyst.

### Logs
![BOT History](images/Bot_History_small.png)

### Source Code
   [Git Link]  (https://github.com/RLIndia/botsfactory/blob/master/Code/UI_BOTs/Org_Creation/src/test/resources/catalyst/settings/orgsetup/1CreateOrganization.feature)
