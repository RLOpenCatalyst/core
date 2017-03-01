package com.relevancelab.catalyst.security.ssh;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import com.jcraft.jsch.ChannelShell;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.relevancelab.catalyst.security.ssh.exceptions.AuthFailedException;
import com.relevancelab.catalyst.security.ssh.exceptions.HostUnreachableException;

public class SSHShell {


	//error codes 
	final int HOST_UNREACHABLE = -5000;
	final int INVALID_CREDENTIALS = -5001;
	final int JSCH_EXCEPTION = -5002;
	final int UNKOWN_EXCEPTION = -5003;

	//ssh parameters
	private final int SSH_TIMEOUT = 60000;
	private String host;
	private int port = 22;
	private String username;
	private String password;
	private String pemFilePath; 


	// socket variables
	private int localSocketPort;
	private Socket socketClient = null;
	private OutputStream cmdReturnStream = null;
	private InputStream cmdStream  = null;




	//jsch variables
	JSch jsch;
	Session session = null;
	ChannelShell channel = null;

	public SSHShell(String host,int port,String username,String password,String pemFilePath,int localSocketPort){
		this.host = host;
		this.port = port;
		this.username = username;
		if(password != null) {
			this.password = password;
		}
		if(pemFilePath != null) {
			this.pemFilePath = pemFilePath;
		}
		this.localSocketPort = localSocketPort;
	}


	private Session openSession() throws JSchException, HostUnreachableException, AuthFailedException {
		JSch.setConfig("StrictHostKeyChecking", "no");

		session = null;
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

	public int open() {

		try {
			//opening local socket

			socketClient = new Socket("localhost", localSocketPort);
			System.out.println("socket connected ==>" +socketClient.getRemoteSocketAddress());
			//getting streams
			cmdStream = socketClient.getInputStream();
			cmdReturnStream = socketClient.getOutputStream();

			Session session = openSession();

			System.out.println("Session Connected");


			channel = (ChannelShell)session.openChannel("shell");
			channel.setPty(true);

			// setting streams 
			channel.setInputStream(cmdStream);
			channel.setOutputStream(cmdReturnStream);
			channel.connect();
			return 0;
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

	public void close() throws IOException {
		//closing 		
		if (channel != null){ 
			System.out.println("channel disconnecting");
			channel.disconnect();
			channel = null;
		}
		if (session != null) {
			System.out.println("session disconnecting");
			session.disconnect();
			session = null;
		}
		jsch = null;
		if(socketClient != null) {
			System.out.println("closing socket");
			socketClient.close();
		}

	}

}
