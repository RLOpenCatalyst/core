package com.relevancelab.catalyst.security.ssh.streamreader;

import java.io.BufferedReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;

public class SSHExecInputStreamReader implements Runnable {

	InputStream sshInputStream;
	String filepath;

	public SSHExecInputStreamReader(InputStream sshInputStream,String filepath){
		this.sshInputStream = sshInputStream;
		this.filepath = filepath;
	}

	public void run(){
		BufferedReader br = null;
		String line;
		PrintWriter pw = null;
		try {
			pw = new PrintWriter(filepath);

			br = new BufferedReader(new InputStreamReader(sshInputStream));
			while ((line = br.readLine()) != null) {
				//System.out.println("From Java ==> "+line);
				//fw.write(line);
				pw.println(line);
				pw.flush();
			}

		} catch (IOException e) {
			e.printStackTrace();
		} finally {
			if (br != null) {
				try {
					br.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
			if(pw != null) {
				pw.close();
			}
		}

	}
}
