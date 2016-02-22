package com.relevancelab.catalyst.security.ssh;
import java.io.IOException;
import java.io.InputStream;

import org.apache.commons.lang.StringEscapeUtils;

import com.jcraft.jsch.*;
import com.relevancelab.catalyst.security.ssh.exceptions.AuthFailedException;
import com.relevancelab.catalyst.security.ssh.exceptions.HostUnreachableException;
import com.relevancelab.catalyst.security.ssh.streamreader.SSHExecInputStreamReader;

public class SSHExec {

	//error codes 
	final int HOST_UNREACHABLE = -5000;
	final int INVALID_CREDENTIALS = -5001;
	final int JSCH_EXCEPTION = -5002;
	final int UNKOWN_EXCEPTION = -5003;


	//ssh parameters
	final int SSH_TIMEOUT = 60000;
	String host;
	int port = 22;
	String username;
	String password;
	String pemFilePath; 



	/**
	 * 
	 * @param host
	 * @param port
	 * @param username
	 * @param password
	 * @param pemFilePath
	 */
	public SSHExec(String host,int port,String username,String password,String pemFilePath){

		this.host = host;
		this.port = port;
		this.username = username;


		if(password != null) {
			this.password = password;
		}
		if(pemFilePath != null) {
			this.pemFilePath = pemFilePath;
		}
	}



	private Session openSession() throws JSchException, HostUnreachableException, AuthFailedException {
		JSch.setConfig("StrictHostKeyChecking", "no");
		JSch jsch;
		Session session = null;
		try {
			jsch=new JSch();
			if(pemFilePath != null) {
				System.out.println("Setting pem file");
				jsch.addIdentity(pemFilePath);
			}
			session=jsch.getSession(username, host, port);
			if(password != null) {
				System.out.println("Setting password");
				session.setPassword(password);
				//sudoCmd = "echo "+password+" | sudo -S";
			}
			System.out.println("Session connecting");
			session.connect(SSH_TIMEOUT);
		} catch (JSchException je) {
			System.out.println(je.getMessage());
			if(je.getMessage().equals("timeout: socket is not established")) {
				throw new HostUnreachableException("Host is not reachable");
			} else if(je.getMessage().equals("Auth fail")) {
				throw new AuthFailedException("Invalid Credentials");
			} else {
				throw je;	
			}

		} catch (Exception e) {
			throw e;
		}
		return session;
	}

	/**
	 * 
	 * @param cmd
	 * @throws JSchException
	 * @throws IOException
	 * @throws AuthFailedException 
	 * @throws HostUnreachableException 
	 */
	private int doSSh(String cmd,String stdOutLogFile,String stdErrLogFile) throws IOException, HostUnreachableException, AuthFailedException, JSchException {
		System.out.println(host);
		System.out.println(port);
		System.out.println(username);
		System.out.println(password);
		System.out.println(pemFilePath);
		System.out.println(stdOutLogFile);
		System.out.println(stdErrLogFile);

		//jsch variables
		InputStream stdOutInputstream;
		InputStream stdErrInputstream;

		ChannelExec channel = null;
		Session session = null;


		try {
			//run stuff



			String sudoCmd = "sudo"; 
			if(password != null) {
				sudoCmd = "echo "+password+" | sudo -S";
			}

			session = openSession();
			channel = (ChannelExec)session.openChannel("exec");
			System.out.println(cmd);
			channel.setCommand(sudoCmd+" "+cmd);
			channel.setPty(true);

			channel.setInputStream(null);
			System.out.println("Getting stream");
			stdOutInputstream = channel.getInputStream();
			stdErrInputstream = channel.getErrStream();
			System.out.println("Connecting channel");
			if(stdOutLogFile != null && !stdOutLogFile.isEmpty()) {
				SSHExecInputStreamReader stdOutReader = new SSHExecInputStreamReader(stdOutInputstream, stdOutLogFile);
				Thread stdOutReaderThread = new Thread(stdOutReader);
				stdOutReaderThread.start();
			}
			if(stdErrLogFile != null && !stdErrLogFile.isEmpty()) {
				SSHExecInputStreamReader stdErrReader = new SSHExecInputStreamReader(stdErrInputstream, stdErrLogFile);
				Thread stdErrReaderThread = new Thread(stdErrReader);
				stdErrReaderThread.start();
			}

			channel.connect();
			while(!channel.isClosed()) {
				//System.out.println("Disconnecting Channel");
				//channel.disconnect();
			}
			System.out.println("Disconnecting Channel");
			channel.disconnect();
			System.out.println("Exit status "+channel.getExitStatus());
			return channel.getExitStatus();
		} finally {
			//Closing everything
			if (channel != null){ 

				channel = null;
			}
			if (session != null) {
				session.disconnect();
				session = null;
			}
		}
	}

	/**
	 * 
	 * @param runlist
	 * @param overrideRunlist
	 * @return
	 * @throws IOException 
	 * @throws JSchException 
	 * @throws AuthFailedException 
	 * @throws HostUnreachableException 
	 */
	public int execChefClient(String runlist,boolean overrideRunlist,String jsonAttributes,boolean lockFile,String stdOutLogFile,String stdErrLogFile) {
		if(runlist == null || runlist.length() == 0){
			return -1002; //Need to think about the return codes
		}
		String cmd = "chef-client";
		if(overrideRunlist) {
			cmd += " -o";
		} else {
			cmd += " -r";
		}
		cmd += " "+runlist;
		String timeStamp = ""+System.currentTimeMillis();
		if(lockFile) {
			cmd +=" --lockfile /var/tmp/catalyst_lockFile_"+timeStamp;
		}
		
		String cmdWithJsonAttribute ="";
		String jsonFileName = "chefRunjsonAttributes_"+timeStamp+".json";
		System.out.println(" jsonAttribute ==> "+ jsonAttributes);
		if(jsonAttributes != null && !jsonAttributes.isEmpty() && !jsonAttributes.equalsIgnoreCase("null")) {
			jsonAttributes = StringEscapeUtils.escapeJava(jsonAttributes);
			cmdWithJsonAttribute +="echo \""+jsonAttributes +"\" > "+jsonFileName + " && sudo "+ cmd +" -j "+jsonFileName;
			cmd  = cmdWithJsonAttribute;
		}
		System.out.println(cmd);
		
		try {
			return  doSSh(cmd,stdOutLogFile,stdErrLogFile);
		} catch(AuthFailedException afe) {
			afe.printStackTrace();
			return INVALID_CREDENTIALS;
		} catch (HostUnreachableException e2) {
			e2.printStackTrace();
			return HOST_UNREACHABLE;
		} catch (JSchException jsche) {
			jsche.printStackTrace();
			return JSCH_EXCEPTION;
		} catch (IOException ioe) {
			ioe.printStackTrace();
			return UNKOWN_EXCEPTION;
		}
		catch (Exception e) {
			e.printStackTrace();
			return UNKOWN_EXCEPTION;
		}


	}

	public int execServiceCmd(String serviceName,String serviceAction,String stdOutLogFile,String stdErrLogFile)  {
		if((serviceName == null || serviceName.length() == 0) || (serviceAction == null || serviceAction.length() == 0)){
			return -1002; //Need to think about the return codes
		}
		String cmd = "service "+serviceName + " " + serviceAction;
		try {
			return doSSh(cmd,stdOutLogFile,stdErrLogFile);
		} catch(AuthFailedException afe) {
			afe.printStackTrace();
			return INVALID_CREDENTIALS;
		} catch (HostUnreachableException e2) {
			e2.printStackTrace();
			return HOST_UNREACHABLE;
		} catch (JSchException jsche) {
			jsche.printStackTrace();
			return JSCH_EXCEPTION;
		} catch (IOException ioe) {
			ioe.printStackTrace();
			return UNKOWN_EXCEPTION;
		}
		catch (Exception e) {
			e.printStackTrace();
			return UNKOWN_EXCEPTION;
		}

	}

	public int executeListOfCmds(String[] cmdArray,String stdOutLogFile,String stdErrLogFile)  {
		if(cmdArray == null || cmdArray.length == 0) {
			return -1002; //Need to think about the return codes
		}
		StringBuilder cmdStringBuilder = new StringBuilder();
		for (int i = 0;i<cmdArray.length;i++) {
			String cmd = cmdArray[i];
			if(cmd !=null && !cmd.isEmpty()) {
				cmdStringBuilder.append(" ").append(cmd);
				if(i < cmdArray.length -1) {
					cmdStringBuilder.append(" &&");
				}
			}
		}
		String cmdString = cmdStringBuilder.toString();
		if(cmdString.endsWith(" &&")) {
			cmdString = cmdString.substring(0, cmdString.length()-4);
		}

		try {
			return doSSh(cmdString,stdOutLogFile,stdErrLogFile);
		} catch(AuthFailedException afe) {
			afe.printStackTrace();
			return INVALID_CREDENTIALS;
		} catch (HostUnreachableException e2) {
			e2.printStackTrace();
			return HOST_UNREACHABLE;
		} catch (JSchException jsche) {
			jsche.printStackTrace();
			return JSCH_EXCEPTION;
		} catch (IOException ioe) {
			ioe.printStackTrace();
			return UNKOWN_EXCEPTION;
		}
		catch (Exception e) {
			e.printStackTrace();
			return UNKOWN_EXCEPTION;
		}

	}


	public static void testMethodStatic() {
		System.out.println("In Static Method");
	}




}