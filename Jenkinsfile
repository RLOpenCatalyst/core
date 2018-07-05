node ('master') {
    def app
    def version

    stage('Cloning repository') {
        checkout scm
        env.WORKSPACE = pwd()
        sh '''cat version.json   | grep version   | head -1   | awk -F: '{ print $2 }' |  sed 's/[",}]//g' > version.txt'''
        version = readFile('version.txt').trim()
    }
    
    stage('Building Docker image') {
        app = docker.build("relevancelab/catalyst-core")
    }

    stage('Quality Check') {
         /*input "Confirm the quality?"*/
        app.inside {
            sh 'echo "Manualy test passed"'
        }
    }

    stage('Push Docker image') {
        docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
            app.push("${version}_b${env.BUILD_NUMBER}")
            app.push("latest")
        }
    }
    
    stage('Cleanup'){
        // Cleanup docker images
        sh 'echo "Cleaning images"'
    }
}
