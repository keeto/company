(function(){

// Item Adder Unit
new Unit({

	Prefix: 'taskadd',

	readySetup: function(){
		var form = document.id('todo-add');
		this.text = document.id('todo-add-text');
		
		form.addEvent('submit', this.onSubmit.bind(this));
	},

	onSubmit: function(event){
		event.preventDefault();
		var text = this.text.get('value');
		if (text.replace(/\s+/g, '') == '') text = 'Blank task.';
		this.reset();
		this.publish('new', text);
	},

	reset: function(){
		this.text.set('value', '');
	}

});


// List Class 

var List = new Class({

	Implements: Events,

	initialize: function(list, template){
		this.list = document.id(list);
		this.template = document.id(template);
		this.list.addEvents({
			'click:relay(a.remove)': this.remove.bind(this),
			'click:relay(a.done)': this.done.bind(this)
		});
	},

	add: function(text){
		var item = this.template.clone();
		this.unempty();
		item.getElement('.todo-text').set('text', text);
		item.set('data-todo', text);
		item.inject(this.list);
	},

	remove: function(event, element){
		event.preventDefault();
		var todo = this.destroyItem(element);
		this.fireEvent('remove', todo);
	},

	done: function(event, element){
		event.preventDefault();
		var todo = this.destroyItem(element);
		this.fireEvent('done', todo);
	},

	destroyItem: function(element){
		var item = element.getParent('li'),
			todo = item.get('data-todo');

		item.destroy();
		if (this.list.getElements('li').length == 0) this.empty();
		return todo;
	},

	unempty: function(){
		this.list.getElements('.no-task').destroy();
	},

	empty: function(){
		document.id('template-empty').clone().inject(this.list);
	}

});


window.addEvent('domready', function(){

// Task List Unit
(function(){

	var tasklist = new List('todo-list', 'template-todo');
	Unit.decorate(tasklist).setPrefix('tasklist');
	tasklist.subscribe({
		'!taskadd.new': tasklist.add.bind(tasklist),
		'!donelist.done': tasklist.add.bind(tasklist)
	});
	
})();

// Done List Unit
(function(){

	var donelist = new List('todo-done', 'template-done');
	Unit.decorate(donelist).setPrefix('donelist');
	donelist.subscribe({
		'!tasklist.done': donelist.add.bind(donelist)
	});

})();

});

// Done List

})();
