# Orchestration-web

## Initialisation

Mise en place d'une stack technique avec Docker.
Initiation à l’orchestration d’une application avec Docker Swarm.

Installation sur la machine des éléments suivants :
- IDE Eclipse + VSCode
- Docker
- PowerShell
- Hyper-V
- JAVA
- Maven
- GIT
- NodeJS

Installation de Hyper-V :
- Avoir PowerShell d’installer
- Utiliser DISM via la commande :
- DISM /Online /Enable-Feature /All /FeatureName:Microsoft-Hyper-V
- Si la commande DISM n’est pas reconnu, vérifier que PATH pointe bien sur C:\Windows\system32

Créer plusieurs instances de machine à l’aide de la commande suivante :
```
$ docker-machine create --driver hyperv ${name}
```

Cette commande nécessitera un commutateur externe. Il est nécessaire de le créer à l’aide de « Hyper-V Manager ». 

**Attention**, le commutateur doit se positionner sur une carte réseau active. Sinon l’allocation d’adresse IP ne sera pas effective.

**Attention**, l’ensemble des clusters créés par la suite seront assignés à ce commutateur. Si par malheur vous le désactivez (désactivation de la carte réseau associée), cela risque de modifier son fonctionnement. Pour ma part lorsque j’ai désactivé ma carte, le commutateur est passé du fonctionnement externe au fonctionnement interne. Ce qui a eu pour incidence d’empêcher l’assignation d’une adresse IP au redémarrage des clusters. Il faudra donc modifier ce commutateur en mode externe.

## Génération des clusters

**Génération des managers**
```
# This configures the number of workers and managers inthe swarm 
$ manager=3
$ workers=3
```

```
# This create the manager machines
$ echo "======> Creating $managers manager machines ...";
$ for node in $(seq 1 $managers);
do
	echo "======> Creating manager$node machine ...";
	docker-machine create -d hyperv manager$node;
done
```

**Générations des workers**
```
# This create worker machines
$ echo "======> Creating $workers worker machines ...";
$ for node in $(seq 1 $workers);
do
	echo "======> Creating worker$node machine ...";
	docker-machine create -d virtualbox worker$node;
done
# This lists all machines created
$ docker-machine ls
```

**Initialisation du Swarm pour le cluster manager1**
```
# initialize swarm mode and create a manager
$ echo "======> Initializing first swarm manager ..."
$ docker-machine ssh manager1 "docker swarm init --listen-addr $(docker-machine ip manager1) --advertise-addr $(docker-machine ip manager1)"
```

**Génération des tokens pour association au Swarm**
```
# get manager and worker tokens
$ export manager_token=`docker-machine ssh manager1 "docker swarm join-token manager -q"`
$ export worker_token=`docker-machine ssh manager1 "docker swarm join-token worker -q"`
```

**Association des managers au Swarm**
```
$ for node in $(seq 2 $managers);
do
	echo "======> manager$node joining swarm as manager ..."
	docker-machine ssh manager$node \
		"docker swarm join \
		--token $manager_token \
		--listen-addr $(docker-machine ip manager$node) \
		--advertise-addr $(docker-machine ip manager$node) \
		$(docker-machine ip manager1)"
done
```

**Association des workers au Swarm**
```
# workers join swarm
$ for node in $(seq 1 $workers);
do
	echo "======> worker$node joining swarm as worker ..."
	docker-machine ssh worker$node \
	"docker swarm join \
	--token $worker_token \
	--listen-addr $(docker-machine ip worker$node) \
	--advertise-addr $(docker-machine ip worker$node) \
	$(docker-machine ip manager1):2377"
done
# show members of swarm
$ docker-machine ssh manager1 "docker node ls"
```

## Visualisation du cluster
Pour visualiser l’état général du cluster, il est nécessaire d’installer le service dockersamples/visualizer
Pour cela il faut se connecter sur le cluster leader (manager1).
```
$ docker-machine ssh manager1
```
Une fois connecté, lancez la commande suivante :
```
$ docker service create \
  --name=viz \
  --publish=8080:8080/tcp \
  --constraint=node.role==manager \
  --mount=type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  dockersamples/visualizer
```
Le visualizer est accessible à l’adresse ip du manager1 sur le port 8080

## Installer son application
Pour pouvoir déployer son application dans le Swarm, il est nécessaire d’uploader les images de ces containers dans les repository docker. Il est aussi possible d’utiliser les registres en locale pour gérer ce type d’action.

Mon application étant constitué en deux couches, j’ai généré deux repository différents. Un pour la partie base de données et un pour la partie back.

Pour pousser une image sur les repos docker il faut procéder de la manière suivante :
```
# Générer les images
$ docker-compose build
# Taguer les images aux repos correspondants
$ docker tag ${name_image} ${name_repo}
# Ex : $ docker tag homefamily_db mirha/db
# Pousser sur le repo
$ docker push mirha/db
```

Une fois les images poussées sur les repos, il suffit simplement d’instancier le service dans le swarm. Il faut donc se connecter en SSH au manager1 et créer les services.

Attention, par défaut un service sera instancié sur un réseau unitaire (bridge). Pour permettre à vos containers de communiquer, il faut utiliser un réseau de type overlay.

```
# Création du réseau au sein du manager
$ docker create network -d overlay mynet
# Création des services
$ docker create service –name db –network mynet -p 5432 :5432 mirha/db
$ docker create service –name back –network mynet -p 8000 :8080 mirha/spring
```

A partir de la j’ai pu tester mon API à l’aide de Postmam en interrogeant l’adresse IP_manager1 :8000

Une fois les services actifs, il est nécessaire de les dupliquer pour gérer la scalabilité de l’application.
```
$ docker service scale ${name}=${number}
```

## Mise en place d'un front ReactJS
Installer Node.js

Si des problèmes de certificat sont remontés lors de l’installation du package create-react-app, supprimer la vérification ssl
```
$ npm config set strict-ssl false
```
Installer la package react
```
$ npm install -g create-react-app
```
Générer l’image docker.

Une fois l’image créée, il suffit d’instancier un nouveau service que l’on nommera web. De préférence, rendre accessible ce service sur le port 80.

Le front est maintenant accessible.

Pour relier le back et le front, récupérer la liste des utilisateurs ainsi que le détail de l’application sur lequel on se trouve (REST).

## Les axes d'amélioration

Pour le moment l'interconnexion des services ne fonctionne pas sur le nom des services. Un travail supplémentaire sur le fonctionnement DNS des services dans Swarm est nécessaire.

Lors de l'extinction du PC, le cluster devient erroné et nécessite une réinstallation compléte de celui-ci. Un systeme de backup serait à prévoir.

La taille des images peut devenir importante? L'upload sur le repo docker peut être fastidieu. Pour accélérer ce processus, l'installation d'un registre en local pour faciliter ce type de processus.

Avec du temps supplémentaire, l'installation d'une intégration continue au sein du Swarm aurait permit une automatisation compléte de la monté de version d'une application.

## Bibliographie
**Docker Swarm** : https://medium.com/@Grigorkh/docker-swarm-tutorial-c5d5cf4b4de

## Repository
- Back : https://github.com/Miratons/Orchestration
- Front : https://github.com/Miratons/Orchestration-web
