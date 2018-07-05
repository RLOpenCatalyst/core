package com.relevancelab.catalyst.security.ssh;
import java.io.IOException;
import java.io.InputStream;


import com.jcraft.jsch.*;
import com.relevancelab.catalyst.security.ssh.streamreader.SSHInputStreamReader;

public class SSH {

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
	public SSH(String host,int port,String username,String password,String pemFilePath){

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

	/**
	 * 
	 * @param cmd
	 * @throws JSchException
	 * @throws IOException
	 */
	private int doSSh(String cmd,String stdOutLogFile,String stdErrLogFile) throws JSchException, IOException {
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
		JSch jsch;
		Session session = null;
		ChannelExec channel = null;


		try {

			String sudoCmd = "sudo"; 

			JSch.setConfig("StrictHostKeyChecking", "no");
			jsch=new JSch();
			if(pemFilePath != null) {
				System.out.println("Setting pem file");
				jsch.addIdentity(pemFilePath);
			}
			session=jsch.getSession(username, host, port);
			if(password != null) {
				System.out.println("Setting password");
				session.setPassword(password);
				sudoCmd = "echo "+password+" | sudo -S";
			}
			System.out.println("Session connecting");
			session.connect(SSH_TIMEOUT);
			System.out.println("Session Connected");
			//run stuff
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
				SSHInputStreamReader stdOutReader = new SSHInputStreamReader(stdOutInputstream, stdOutLogFile);
				Thread stdOutReaderThread = new Thread(stdOutReader);
				stdOutReaderThread.start();
			}
			if(stdErrLogFile != null && !stdErrLogFile.isEmpty()) {
				SSHInputStreamReader stdErrReader = new SSHInputStreamReader(stdErrInputstream, stdErrLogFile);
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
			jsch = null;
		}
	}

	/**
	 * 
	 * @param runlist
	 * @param overrideRunlist
	 * @return
	 */
	public int execChefClient(String runlist,boolean overrideRunlist,String stdOutLogFile,String stdErrLogFile) {
		if(runlist == null || runlist.length() == 0){
			return -1002; //Need to think about the return codes
		}
		try {
			String cmd = "chef-client";
			if(overrideRunlist) {
				cmd += " -o";
			} else {
				cmd += " -r";
			}
			cmd += " "+runlist;
			return doSSh(cmd,stdOutLogFile,stdErrLogFile);
		} catch (JSchException | IOException e) {
			System.out.println("Exception Occured");
			//e.printStackTrace();
			e.printStackTrace();
			return -1001; /// need to think about it
		} 

	}

	public int execServiceCmd(String serviceName,String serviceAction,String stdOutLogFile,String stdErrLogFile) {
		if((serviceName == null || serviceName.length() == 0) || (serviceAction == null || serviceAction.length() == 0)){
			return -1002; //Need to think about the return codes
		}
		try {
			String cmd = "service "+serviceName + " " + serviceAction;
			return doSSh(cmd,stdOutLogFile,stdErrLogFile);
		} catch (JSchException | IOException e) {
			e.printStackTrace();
			return -1001; /// need to think about it
		}
	}

	public int executeListOfCmds(String[] cmdArray,String stdOutLogFile,String stdErrLogFile) {
		if(cmdArray == null || cmdArray.length == 0) {
			return -1002; //Need to think about the return codes
		}
		try {
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
			
			return doSSh(cmdString,stdOutLogFile,stdErrLogFile);
		} catch (JSchException | IOException e) {
			e.printStackTrace();
			return -1001; /// need to think about it
		}
	}


	public static void testMethodStatic() {
		System.out.println("In Static Method");
	}


}